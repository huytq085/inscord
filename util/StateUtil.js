const fs = require("fs");

const saveFilePath = "app-state.json";

exports.save = (data) => {
    fs.writeFileSync(saveFilePath, JSON.stringify(data));
}

exports.load = () => {
    const data = fs.readFileSync(saveFilePath, "utf-8");
    return JSON.parse(JSON.stringify(data));
}

exports.isExists = () => {
    return fs.existsSync(saveFilePath)
}
