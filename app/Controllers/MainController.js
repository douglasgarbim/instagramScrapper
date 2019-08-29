const Scrapper = require('../Scrapper')

module.exports = {
  async dynamic(req, res) {
    const scrap = new Scrapper(req.params.user)
    let data = null

    try {
      data = await scrap.dynamic(req.params.posts)
    } catch (error) {
      res.send(`There is a error with the request: ${error}`)
    }

    return res.send(data)
  },

  async static(req, res) {
    const scrap = new Scrapper(req.params.user)
    let data = null

    try {
      data = await scrap.static()
    } catch (error) {
      res.send(`There is a error with the request: ${error}`)
    }

    return res.send(data)
  }
}