const fs = require("fs");

const Personalisation = {
    dices : [],
    background_keys : [],
};

(function()
{
    const readDir = function(rootDir)
    {
        try
        {
            let files = fs.readdirSync(rootDir);
            let res = files.filter(filename => fs.statSync(rootDir+ "/" + filename).isDirectory())

            res.sort();
            return res;
        }
        catch (err)
        {
            console.log(err);
        }

        return [];
    };

    const readFiles = function(rootDir)
    {
        try
        {
            let files = fs.readdirSync(rootDir);
            let res = files.filter(filename => fs.statSync(rootDir+ "/" + filename).isFile())

            res.sort();
            return res;
        }
        catch (err)
        {
            console.log(err);
        }

        return [];
    };

    const toMap = function(list)
    {
        if (list.length === 0)
            return { };

        let res = { };

        const len = list.length;
        for (let i = 0; i < len; i++)
            res["bg-" + i] = list[i];

        return res;
    };

    const writePersonalisationCss = function(map)
    {
        const data = [];
        for (let key in map)
            data.push(`.${key} { background: url("/media/personalisation/backgrounds/${map[key]}") no-repeat center center fixed; background-size: cover; }`);
    
        fs.writeFileSync(__dirname + "/public/media/personalisation/personalisation.css", data.join("\n"));
    };

    Personalisation.dices = readDir(__dirname + "/public/media/personalisation/dice");

    const backgorunds = toMap(readFiles(__dirname + "/public/media/personalisation/backgrounds"));
    Personalisation.background_keys = Object.keys(backgorunds);
    writePersonalisationCss(backgorunds);

    console.log("personalisation information:");
    console.log("\t - "+Personalisation.dices.length + " dice(s) available");
    console.log("\t - "+Personalisation.background_keys.length + " background(s) available");
})();

module.exports = function(SERVER)
{
    SERVER.instance.get("/data/dices", SERVER.caching.expires.jsonCallback, (_req, res) => res.send(Personalisation.dices).status(200));
    SERVER.instance.get("/data/backgrounds", SERVER.caching.expires.jsonCallback, (_req, res) => res.send(Personalisation.background_keys).status(200));
}

