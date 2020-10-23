const { IgApiClient } = require('instagram-private-api');
const Discord = require('discord.js');
const StateUtil = require("./util/StateUtil");
const Constants = require("./util/Constants");
const SortUtil = require("./util/SortUtil");
const MessageUtil = require("./util/MessageUtil");
const Logger = require("./util/Logger");
const InfoUtil = require("./util/InfoUtil");

const discordClient = new Discord.Client();
const ig = new IgApiClient();
require('dotenv').config();

// Store the authenticated user
let auth;

discordClient.on('ready', () => {
    Logger.info(`Logged in as ${discordClient.user.tag}!`);
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
    } else if (msg.content.startsWith(Constants.Command.FEED_POST)) {
        handleFeedPost(msg);
    }
});

discordClient.login(process.env.DISCORD_BOT_TOKEN);

async function login(userName, password) {
    Logger.info('Login as ' + userName);
    ig.state.generateDevice(userName);
    try {

        if (StateUtil.isExists(userName) && typeof password === "undefined") {
            Logger.info('Exist state');
            const data = StateUtil.load(userName);
            await ig.state.deserialize(data);
            auth = await ig.user.info(ig.state.cookieUserId);
        } else {
            if (typeof password === "undefined") {
                const message = userName + " is not exists. Please provide password.";
                MessageUtil.notify(discordClient, message, Constants.Color.ERROR);
                return;
            }
            Logger.info('Not Exist state');
            await ig.account.logout();
            auth = await ig.account.login(userName, password);
        }
        const serialized = await ig.state.serialize();
        StateUtil.save(userName, serialized);
        welcomeLogin(auth);
    } catch (e) {
        Logger.error(e);
        StateUtil.delete(userName);
    }
}

function handleLogin(msg) {
    const splittedContents = msg.content.split(" ");
    if (splittedContents.length < 2 || splittedContents.length > 3) {
        let message = 'Syntax error!'
        message += '\nCommand for login: ```/login username password```'
        message += '\nIf you want to login into the existing user: ```/login username```'
        MessageUtil.notify(discordClient, message, Constants.Color.ERROR);
        return;
    }
    const userName = splittedContents[1];
    const password = splittedContents[2];
    login(userName, password);
}

function handleCurrentUser() {
    ig.account.currentUser().then(currentUser => {
        const message = "Current user: @" + currentUser.username;
        MessageUtil.notify(discordClient, message, Constants.Color.INFO);
    })
}

function handleFeedStory(msg) {
    const splittedContents = msg.content.split(" ");
    if (splittedContents.length > 1 && splittedContents[1] !== "") {
        ig.user.searchExact(splittedContents[1]).then(user => {
            getStory(user)
                .then(stories => {
                    sendStory(user, stories);
                })
                .catch(err => {
                    Logger.error(err);
                    MessageUtil.notify(err.message + " :thermometer_face:");
                })
        })
    }
}

function handleFeedPost(msg) {
    const splittedContents = msg.content.split(" ");
    if (splittedContents.length > 0) {
        getPost()
            .then(posts => {
                sendPost(posts);
            })
            .catch(err => {
                Logger.error(err);
                MessageUtil.notify(err.message + " :thermometer_face:");
            })
    }
}

function sendPost(posts) {
    if (posts.length > 0) {
        SortUtil.sortByUnixTime(posts, "takenAt");
        MessageUtil.sendPost(discordClient, posts);
    } else {
        MessageUtil.notify(discordClient, "No posts :weary: ", Constants.Color.INFO);
    }
}

function sendStory(user, stories) {
    if (stories.length > 0) {
        SortUtil.sortByUnixTime(stories, "takenAt");
        MessageUtil.sendStory(discordClient, user, stories);
    } else {
        MessageUtil.notify(discordClient, "No posts :weary: ", Constants.Color.INFO);
    }
}

async function getStory(user) {
    Logger.info("Get Story");
    const reelsFeed = ig.feed.reelsMedia({ // working with reels media feed (stories feed)
        userIds: [user.pk], // you can specify multiple user id's, "pk" param is user id
    });
    const storyItems = await reelsFeed.items(); // getting reels, see "account-followers.feed.example.ts" if you want to know how to work with feeds
    if (storyItems.length === 0) {// we can check items length and find out if the user does have any story to watch
        Logger.info(`${user.username}'s story is empty`);
        return [];
    }
    return InfoUtil.makeStory(storyItems);
};

async function getPost() {
    const postItems = await ig.feed.timeline().items();
    if (postItems.length === 0) {
        Logger.info("No posts");
        return [];
    }
    return InfoUtil.makePost(postItems);
}

function welcomeLogin() {
    const message = "Welcome, @" + auth.username;
    MessageUtil.notify(discordClient, message, Constants.Color.SUCCESS);
}