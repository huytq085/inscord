const { IgApiClient } = require('instagram-private-api');
const Discord = require('discord.js');
const StateUtil = require("./util/StateUtil");
const moment = require("moment");
const Constants = require("./util/Constants");
const SortUtil = require("./util/SortUtil");
const MessageUtil = require("./util/MessageUtil");

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
    if (msg.content.startsWith(Constants.Command.LOGIN)) {
        handleLogin(msg);
    } else if (msg.content.startsWith(Constants.Command.CURRENT_USER)) {
        handleCurrentUser();
    } else if (msg.content.startsWith(Constants.Command.FEED_STORY)) {
        handleFeedStory(msg);
    }
});

discordClient.login(process.env.DISCORD_BOT_TOKEN);

async function login(userName, password) {
    console.log('Login as ' + userName);
    ig.state.generateDevice(userName);
    try {
        let auth;
        if (StateUtil.isExists(userName) && typeof password === "undefined") {
            console.log('Exists');
            const data = StateUtil.load(userName);
            await ig.state.deserialize(data);
            auth = await ig.user.info(ig.state.cookieUserId);
        } else {
            if (typeof password === "undefined") {
                const message = userName + " is not exists. Please provide password.";
                MessageUtil.send(discordClient, message, Constants.Color.ERROR);
                return;
            }
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
    if (splittedContents.length < 2 || splittedContents.length > 3) {
        let message = 'Syntax error!'
        message += '\nCommand for login: ```/login username password```'
        message += '\nIf you want to login into the existing user: ```/login username```'
        MessageUtil.send(discordClient, message, Constants.Color.ERROR);
        return;
    }
    const userName = splittedContents[1];
    const password = splittedContents[2];
    login(userName, password);
}

function handleCurrentUser() {
    ig.account.currentUser().then(currentUser => {
        const message = "Current user: @" + currentUser.username;
        MessageUtil.send(discordClient, message, Constants.Color.INFO);
    })
}

function handleFeedStory(msg) {
    const splittedContents = msg.content.split(" ");
    if (splittedContents.length > 1 && splittedContents[1] !== "") {
        ig.user.searchExact(splittedContents[1]).then(user => {
            getStory(user)
                .then(stories => {
                    if (stories.length > 0) {
                        SortUtil.sortByTime(stories, "takenAt");
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

function welcomeLogin(auth) {
    const message = "Welcome, @" + auth.username;
    MessageUtil.send(discordClient, message, Constants.Color.SUCCESS);
}