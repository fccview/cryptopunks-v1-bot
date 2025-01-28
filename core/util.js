const { MessageAttachment } = require("discord.js");
const mergeImages = require('merge-images');
const { Canvas, Image } = require('canvas');
let Jimp = require('jimp');

module.exports = {
    isNumeric: function(value) {
        return /^\d+$/.test(value);
    },

    changeBG: function(interaction, args, environment, accessories = '') {
        let self = this;
        let template = '';
        if (args[0]) {
            let punk = args[0];
            if (self.isNumeric(punk) && parseInt(punk) <= 9999) {
                let url = __dirname.replace('core', '') + '/img/nobg/' + punk + '.png';
                let layer = '';

                if (environment === 'colour') {
                    if (args[1]) {
                        if (args[1] === 'transparent') {
                            Jimp.read(url, function (err, image) {
                                if (err) throw err;
                                image
                                    .rgba(true)
                                    .background(0x00000000)
                                    .getBuffer(Jimp.MIME_PNG, function (err, outputBuffer) {
                                        const sfbuff = new Buffer.from(outputBuffer);
                                        const sfattach = new MessageAttachment(sfbuff, punk + "_" + args[1].replace('#', '') + ".png");
                                        interaction.reply({files: [sfattach], ephemeral: false});
                                    });
                            });
                        } else {
                            if (args[1].replace('#', '').length === 6) {
                                Jimp.read(url, function (err, image) {
                                    if (err) throw err;
                                    image
                                        .rgba(true)
                                        .background(parseInt('0x' + args[1].replace('#', '').toUpperCase() + 'FF'))
                                        .getBuffer(Jimp.MIME_JPEG, function (err, outputBuffer) {
                                            const sfbuff = new Buffer.from(outputBuffer);
                                            const sfattach = new MessageAttachment(sfbuff, punk + "_" + args[1].replace('#', '') + ".jpg");
                                            interaction.reply({files: [sfattach], ephemeral: false});
                                        });
                                });
                            } else {
                                interaction.reply('Sorry, that\'s not a valid hex code');
                            }
                        }
                    } else {
                        Jimp.read(url, function (err, image) {
                            if (err) throw err;
                            image
                                .rgba(true)
                                .background(parseInt('0xA79AFFFF'))
                                .getBuffer(Jimp.MIME_JPEG, function (err, outputBuffer) {
                                    const sfbuff = new Buffer.from(outputBuffer);
                                    const sfattach = new MessageAttachment(sfbuff, punk+".jpg");
                                    interaction.reply({files: [sfattach], ephemeral: false});
                                });
                        });
                    }
                } else {
                    let url = __dirname.replace('core', '') + '/img/nobg/' + args[0] + '.png';
                    template = __dirname.replace('core', '') + '/img/layers/purple-bg.png';

                    let mergingOptions = [{src: template}, {src: url}];

                    if (environment === 'gm') {
                        template = __dirname.replace('core', '') + '/img/layers/purple-bg.png';
                    }

                    if (environment === 'nobg') {
                        mergingOptions = [{src: url}];
                    }

                    if (accessories !== '') {
                        if (accessories === 'gm') {
                            layer = __dirname.replace('core', '') + '/img/layers/gm.png';
                        }

                        if (accessories === 'yuga') {
                            layer = __dirname.replace('core', '') + '/img/layers/yuga.png';
                        }

                        mergingOptions = [{src: template}, {src: url}, {src:layer}];
                    }

                    mergeImages(mergingOptions,{
                        Canvas: Canvas,
                        Image: Image
                    }).then(b64 => {
                        const sfbuff = new Buffer.from(b64.split(",")[1], "base64");
                        const sfattach = new MessageAttachment(sfbuff, args[0]+"_"+environment+".png");
                        interaction.reply({files: [sfattach], ephemeral: false});
                    });
                }
            } else {
                interaction.reply("Sorry, can't find that Punk");
            }
        } else {
            interaction.reply("Sorry, invalid command!");
        }
    },

    mergePunks: function(interaction, args, environment) {
        let self = this;
        if (args[0] && args[1]) {
            let punk1 = args[0];
            let punk2 = args[1];
            
            if (self.isNumeric(punk1) && self.isNumeric(punk2) && 
                parseInt(punk1) <= 9999 && parseInt(punk2) <= 9999) {
                
                let url1 = __dirname.replace('core', '') + '/img/nobg/' + punk1 + '.png';
                let url2 = __dirname.replace('core', '') + '/img/nobg/' + punk2 + '.png';
                let bg = __dirname.replace('core', '') + '/img/layers/purple-bg.png';
                let speech = __dirname.replace('core', '') + '/img/layers/speech-hearts.png';

                // Read and flip the second punk
                Jimp.read(url2).then(image => {
                    image.flip(true, false)  // flip horizontal = true, vertical = false
                        .getBuffer(Jimp.MIME_PNG, (err, flippedPunk) => {
                            if (err) throw err;
                            
                            mergeImages([
                                {src: bg},
                                {src: bg, x: 816},
                                {src: url1},
                                {src: flippedPunk, x: 816},
                                {src: speech}
                            ], {
                                Canvas: Canvas,
                                Image: Image,
                                width: 1632
                            }).then(b64 => {
                                const sfbuff = new Buffer.from(b64.split(",")[1], "base64");
                                const sfattach = new MessageAttachment(sfbuff, `${punk1}_${punk2}_love.png`);
                                interaction.reply({files: [sfattach], ephemeral: false});
                            });
                        });
                }).catch(err => {
                    console.error(err);
                    interaction.reply("Sorry, there was an error processing the image");
                });
            } else {
                interaction.reply("Sorry, can't find one of those Punks");
            }
        } else {
            interaction.reply("Sorry, invalid command!");
        }
    }
}