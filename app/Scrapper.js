const puppeteer = require(`puppeteer`)
const ora = require(`ora`)
const chalk = require(`chalk`)
const axios = require(`axios`)

class Scrapper {
  constructor(path = `instagram`, host = `https://instagram.com/`) {
    this.path = path
    this.host = host
    this.spinner = ora().start()
  }

  get url() {
    return `${this.host}${this.path}`
  }

  async dynamic(postsNumber = 10) {
    this.spinner.text = chalk.yellow(`Getting from: ${this.url}`)

    this.browser = await puppeteer.launch({
      headless: true,
    })
    this.page = await this.browser.newPage()

    await this.page.goto(this.url, {
      waitUntil: `networkidle0`
    })

    if (await this.page.$(`.dialog-404`)) {
      this.spinner.fail(`The url you followed may be broken`);
      process.exit()
    } 
    
    this.spinner.succeed(chalk.green(`Valid page found`))

    const followers = await this.page.evaluate(() => {
      return document.querySelector(`section > main > div > header > section > ul > li:nth-child(2) > a > span`).textContent
    })
    const bio = await this.page.evaluate(() => {
      return document.querySelector(`section > main > div > header > section > div.-vDIg > span`).textContent
    })

    let media = {
      followers: followers,
      bio: bio,
      content: []
    }

    while (media.content.length < postsNumber) {
      try {
        let previousHeight = await this.page.evaluate(`document.body.scrollHeight`)
        await this.page.evaluate(`window.scrollTo(0, document.body.scrollHeight)`)
        await this.page.waitForFunction(`document.body.scrollHeight > ${previousHeight}`)
        await this.page.waitFor(1000)

        const nodes = await this.page.evaluate(() => {
          const links = document.querySelectorAll(`.v1Nh3 > a`)
          const images = document.querySelectorAll(`a > div > div.KL4Bh > img`)
          
          return { images: [].map.call(images, img => img.src), links: [].map.call(links, link => link.href) }
        })

        for (let index = 0; index < postsNumber; index++) {
          const image = nodes['images'][index]
          const link = nodes['links'][index]

          try {
            await this.page.goto(link, {
              waitUntil: `networkidle0`
            })

            const desc = await this.page.evaluate(() => {
              return document.querySelector(`div.EtaWk > ul > div > li > div > div > div.C4VMK > span`).textContent
            })

            if (media.content.length < postsNumber) {
              media.content.push({link: link, thumb: image, desc: desc})
            }

          } catch (error) {
            console.error(error)
          }          
        }
      }
      catch (error) {
        console.error(error)
      }
    }

    this.spinner.succeed(chalk.green(`Scraped ${media.content.length} posts`))

    await this.page.close()
    await this.browser.close()
    
    return media
  }

  async static() {
    this.spinner.text = chalk.yellow(`Getting from: ${this.url}`)

    var scrappedData = null

    try {
      await axios({
        url: `${this.url}/?__a=1`,
        method: 'get',
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          'Access-Control-Allow-Origin': '*',
        }
      }).then((response) => {
        if(response.status === 200) {
          this.spinner.succeed(chalk.green(`Valid page found`))
  
          const content = response.data
  
          const profileImage = content.graphql.user.profile_pic_url_hd
          const bio = content.graphql.user.biography
          const follow = content.graphql.user.edge_follow.count
          const followers = content.graphql.user.edge_followed_by.count
          const isPrivate = content.graphql.user.is_private
  
          let media = {
            profileImage: profileImage,
            bio: bio,
            follow: follow,
            followers: followers,
            isPrivate: isPrivate,
            content: []
          }
  
          const timeLineMedia = !isPrivate ? content.graphql.user.edge_owner_to_timeline_media.edges : isPrivate
          
          if(!isPrivate){
            for (let i = 0; i < timeLineMedia.length; i++) {
              const post = timeLineMedia[i].node
              const shortCode = post.shortcode
              const postLink = `https://www.instagram.com/p/${shortCode}`
              const postThumb = `${postLink}/media/?size=l`
              const postDesc = post.edge_media_to_caption.edges[0].node.text
              const postLikes = post.edge_liked_by.count
              const postComments = post.edge_media_to_comment.count
              const isVideo = post.is_video
  
              media.content.push({
                link: postLink,
                thumb: postThumb,
                desc: postDesc,
                likes: postLikes,
                comments: postComments,
                isVideo: isVideo
              })
            }
          }

          this.spinner.succeed(chalk.green(`Instagram profille scrapped!`))
          this.spinner.stop()
  
          scrappedData = media
        } else {
          this.spinner.stop()
          console.log(`Error sending the request. It returned the status of ${response.status}`)
        }
      })
    } catch (error) {
      this.spinner.fail(`The url you followed may be broken`)
      this.spinner.stop()

      return error.message
    }
    
    // process.on('exit', function(code) {
    //   const confirm = ora().start()
    //   confirm.succeed(chalk.green(`Instagram profile scrapped`))

    //   return scrappedData
    // })

    return scrappedData
  }
}

module.exports = Scrapper