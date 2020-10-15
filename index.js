const { IgApiClient } = require('instagram-private-api');
const Discord = require('discord.js');
const StateUtil = require("./util/StateUtil")

const discordClient = new Discord.Client();
const ig = new IgApiClient();
require('dotenv').config();

async function login() {
    console.log('Login');
    ig.state.generateDevice(process.env.USER_NAME);
    try {
        ig.request.end$.subscribe(async () => {
            const serialized = await ig.state.serialize();
            // delete serialized.constants;
            StateUtil.save(serialized);
        });
        if (StateUtil.isExists()) {
            console.log('Exists');
            const data = StateUtil.load();
            await ig.state.deserialize(data);
            await ig.user.info(ig.state.cookieUserId);
        } else {
            console.log('Not Exists');
            const auth = await ig.account.login(process.env.USER_NAME, process.env.PASSWORD);
            console.log(auth);
        }
    } catch (e) {
        console.log(e);
    }
}
async function getStory(targetUsername) {
    console.log("Get Story");
    const stories = [];
    const targetUser = await ig.user.searchExact(targetUsername); // getting exact user by login
    const reelsFeed = ig.feed.reelsMedia({ // working with reels media feed (stories feed)
        userIds: [targetUser.pk], // you can specify multiple user id's, "pk" param is user id
    });
    const storyItems = await reelsFeed.items(); // getting reels, see "account-followers.feed.example.ts" if you want to know how to work with feeds
    if (storyItems.length === 0) {// we can check items length and find out if the user does have any story to watch
        console.log(`${targetUser.username}'s story is empty`);
        return stories;
    }
    storyItems.forEach(item => {
        let type = item.video_versions ? "video" : "photo";
        stories.push({
            type,
            photoUrl: item.image_versions2 ? item.image_versions2.candidates[0].url : null,
            videoUrl: item.video_versions ? item.video_versions[0].url : null
        })
    })
    console.log("return stos: " + JSON.stringify(stories));
    return stories;
};


discordClient.on('ready', () => {
    console.log(`Logged in as ${discordClient.user.tag}!`);
    login();
});

discordClient.on('message', msg => {
    if (msg.content === 'ping') {
        msg.reply('Pong!');
    }
    if (msg.content.startsWith("/feed-story")) {
        const splittedContents = msg.content.split(" ");
        if (splittedContents.length > 1 && splittedContents[1] !== "") {
            getStory(splittedContents[1]).then(stories => {
                if (stories.length > 0) {
                    msg.reply(stories[0].photoUrl);
                    if (stories[0].type === "video") {
                        msg.reply(stories[0].videoUrl);
                    }
                } else {
                    msg.reply("No stories :weary: ")
                }
            })
        }
    }
});

discordClient.login(process.env.DISCORD_BOT_TOKEN);
