const { Color } = require("./Constants");
const moment = require("moment");

exports.notify = (client, message, color) => {
    client.channels.cache.get(process.env.DISCORD_CHANNEL_ID_INSCORD).send({
        embed: {
            "title": message,
            "color": color ? color : Color.INFO
        },
    });
}

exports.sendStory = (client, user, stories) => {
    stories.forEach(story => {
        const url = story.type === "video" ? story.videoUrl : story.photoUrl;
        client.channels.cache.get(process.env.DISCORD_CHANNEL_ID_INSCORD).send({
            embed: {
                "author": {
                    "name": user.targetUsername,
                    "url": "https://www.instagram.com/" + user.targetUsername,
                    "icon_url": user.profile_pic_url
                },
                "color": 2194493,
                "description": moment.unix(story.takenAt).format("LLL"),
            },
            files: [url],
        })
    })
}

exports.sendPost = (client, posts) => {
    posts.forEach(post => {
        const url = post.type === "video" ? post.videoUrl : post.photoUrl;
        client.channels.cache.get(process.env.DISCORD_CHANNEL_ID_INSCORD).send({
            embed: {
                "author": {
                    "name": post.user.userName,
                    "url": "https://www.instagram.com/" + post.user.userName,
                    "icon_url": post.user.avatarUrl
                },
                "color": 2194493,
                "description": moment.unix(post.takenAt).format("LLL"),
            },
            files: [url],
        })
    })
}