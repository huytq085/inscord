const { Color } = require("./Constants")
exports.send = (client, message, color) => {
    client.channels.cache.get(process.env.DISCORD_CHANNEL_ID_INSCORD).send({
        embed: {
            "title": message,
            "color": color ? color : Color.INFO
        },
    });
}