const axios = require('axios');
const Dev = require('../models/Dev');
const parseStringAsArray = require('../utils/parseStringAsArray');
const { findConnections, sendMessage } = require('../websocket');

module.exports = {
  async index(req, res) {
    const devs = await Dev.find();

    return res.json(devs);
  },

  async store(req, res) {
    const { github_username, techs, longitude, latitude } = req.body;

    let dev = await Dev.findOne({ github_username });

    if (!dev) {
      const response = await axios.get(
        `https://api.github.com/users/${github_username}`
      );

      const { name = login, avatar_url, bio } = response.data;

      const techsArray = parseStringAsArray(techs);

      const location = {
        type: 'Point',
        coordinates: [longitude, latitude],
      };

      dev = await Dev.create({
        github_username,
        name,
        avatar_url,
        bio,
        techs: techsArray,
        location,
      });

      const sendSocketMessageTo = findConnections(
        {
          latitude,
          longitude,
        },
        techsArray
      );

      sendMessage(sendSocketMessageTo, 'newDev', dev);
    }

    return res.json(dev);
  },

  async update(req, res) {
    const devs = await Dev.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    return res.json(devs);
  },

  async destroy(req, res) {
    await Dev.findByIdAndRemove(req.params.id);

    return res.send({ message: 'Dev was deleted correctly' });
  },
};
