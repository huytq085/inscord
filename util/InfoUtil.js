exports.makeStory = (stories) => {
    return stories.map(item => {
        return {
            type: item.video_versions ? "video" : "photo",
            takenAt: item.taken_at,
            photoUrl: item.image_versions2 ? item.image_versions2.candidates[0].url : null,
            videoUrl: item.video_versions ? item.video_versions[0].url : null
        }
    })
}

exports.makePost = (posts) => {
    return posts.map(item => {
        return {
            type: item.video_versions ? "video" : "photo",
            caption: (typeof item.caption !== "undefined") ? item.caption.text : null,
            user: (typeof item.user !== "undefined") ? {
                userName: item.user.username,
                fullName: item.user.full_name,
                avatarUrl: item.user.profile_pic_url
            } : null,
            takenAt: item.taken_at,
            photoUrl: item.image_versions2 ? item.image_versions2.candidates[0].url : null,
            videoUrl: item.video_versions ? item.video_versions[0].url : null
        }
    })
}

