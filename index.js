const { IgApiClient } = require('instagram-private-api');
const Discord = require('discord.js');
const StateUtil = require("./util/StateUtil");
const moment = require("moment");
const Constants = require("./util/Constants");

const discordClient = new Discord.Client();
const ig = new IgApiClient();
require('dotenv').config();

discordClient.on('ready', () => {
    console.log(`Logged in as ${discordClient.user.tag}!`);
    login(process.env.USER_NAME, process.env.PASSWORD);
});

discordClient.on('message', msg => {
    if (msg.content === 'ping') {
        msg.reply('Pong!');
    }
    if (msg.content.startsWith(Constants.command.LOGIN)) {
        handleLogin(msg);
    } else if (msg.content.startsWith(Constants.command.CURRENT_USER)) {
        handleCurrentUser();
    } else if (msg.content.startsWith(Constants.command.FEED_STORY)) {
        handleFeedStory(msg);
    }
});

discordClient.login(process.env.DISCORD_BOT_TOKEN);

function welcomeLogin(auth) {
    discordClient.channels.cache.get(process.env.DISCORD_CHANNEL_ID_INSCORD).send({
        embed: {
            "title": "Welcome, @" + auth.username,
            "color": 8311585
        },
    })
}

async function handleCurrentUser() {
    const currentUser = await ig.account.currentUser();
    discordClient.channels.cache.get(process.env.DISCORD_CHANNEL_ID_INSCORD).send({
        embed: {
            "title": "Current user: @" + currentUser.username,
            "color": 10197915
        },
    })
}

async function login(userName, password) {
    console.log('Login as ' + userName);
    ig.state.generateDevice(userName);
    try {
        let auth;
        if (StateUtil.isExists(userName)) {
            console.log('Exists');
            const data = StateUtil.load(userName);
            await ig.state.deserialize(data);
            auth = await ig.user.info(ig.state.cookieUserId);
        } else {
            console.log('Not Exists');
            await ig.account.logout();
            auth = await ig.account.login(userName, password);
        }
        const serialized = await ig.state.serialize();
        // delete serialized.constants;
        StateUtil.save(userName, serialized);
        welcomeLogin(auth);
    } catch (e) {
        console.log(e);
        StateUtil.delete(userName);
    }
}

function handleLogin(msg) {
    const splittedContents = msg.content.split(" ");
    if (splittedContents.length < 3) {
        msg.reply('Syntax error! Use this format: ```/login username password```');
        return;
    }
    const userName = splittedContents[1];
    const password = splittedContents[2];
    login(userName, password);

}

function handleFeedStory(msg) {
    const splittedContents = msg.content.split(" ");
    if (splittedContents.length > 1 && splittedContents[1] !== "") {
        ig.user.searchExact(splittedContents[1]).then(user => {
            getStory(user)
                .then(stories => {
                    if (stories.length > 0) {
                        stories.forEach(story => {
                            const url = story.type === "video" ? story.videoUrl : story.photoUrl;
                            discordClient.channels.cache.get(process.env.DISCORD_CHANNEL_ID_INSCORD).send({
                                embed: {
                                    "author": {
                                        "name": user.full_name,
                                        "url": "https://www.instagram.com/" + user.targetUsername,
                                        "icon_url": user.profile_pic_url
                                    },
                                    "color": 2194493,
                                    "description": moment.unix(story.takenAt).format("LLL"),
                                },
                                files: [url],
                            })
                        })
                    } else {
                        discordClient.channels.cache.get(process.env.DISCORD_CHANNEL_ID_INSCORD).send("No stories :weary: ")
                    }
                })
                .catch(err => {
                    msg.reply(err.message + " :thermometer_face:");
                })
        })

    }
}

async function getStory(user) {
    console.log("Get Story");
    const stories = [];
    const reelsFeed = ig.feed.reelsMedia({ // working with reels media feed (stories feed)
        userIds: [user.pk], // you can specify multiple user id's, "pk" param is user id
    });
    const storyItems = await reelsFeed.items(); // getting reels, see "account-followers.feed.example.ts" if you want to know how to work with feeds
    if (storyItems.length === 0) {// we can check items length and find out if the user does have any story to watch
        console.log(`${user.username}'s story is empty`);
        return stories;
    }
    storyItems.forEach(item => {
        let type = item.video_versions ? "video" : "photo";
        stories.push({
            type,
            takenAt: item.taken_at,
            photoUrl: item.image_versions2 ? item.image_versions2.candidates[0].url : null,
            videoUrl: item.video_versions ? item.video_versions[0].url : null
        })
    })
    return stories;
};