module.exports = {
    /**
     *
     * @param interaction
     * @param whichLimit
     * @param customMessage
     * @returns {boolean}
     */
    limitSpam: function(interaction, whichLimit = 'holders', customMessage = "Sorry, you can't use this command") {
        if (whichLimit === 'staff') {
            if (interaction.member.roles.cache.some(r => r.id === "890355254347051039") || //admins
                interaction.member.roles.cache.some(r => r.id === "890589114150322217") || //mods
                interaction.member.roles.cache.some( r => r.id === "978980958193713153")) { //test server
                return true;
            }
        } else if (whichLimit === 'holders') {
            if(interaction.member.roles.cache.some(r => r.id === "890355254347051039") || //admins
                interaction.member.roles.cache.some(r => r.id === "890589114150322217") || //mods
                interaction.member.roles.cache.some(r => r.id === "890353708234326126") || //holders
                interaction.member.roles.cache.some( r => r.id === "978980958193713153")) { //test server
                return true;
            }
        }
        return false;
    },

    /**
     *
     * @param client
     * @param channel
     */
    safetyProtocol: function(client, channel) {
        let item = new Discord.MessageEmbed()
            .setColor(this.randomColor())
            .setTitle("V1 CryptoPunks Safety Protocol")
            .setDescription("A scammer is going around impersonating staff members begging for some ETH to help with a transaction!\n\n" +
                "<a:chartgreen:931902465413120011> **IT'S NOT US**\n\n" +
                "<a:chartgreen:931902465413120011> **V1 CryptoPunks staff will NEVER DM you** we will ALWAYS ask YOU to DM us!\n\n" +
                "<a:chartgreen:931902465413120011> Be careful and skeptical of DMs. We’ve tried to keep scammers and team impersonators out of this discord with the extra verification steps but stay alert! Never share your wallet, screen share or share any private information with anyone! Our team will never ask for personal information, your wallet keys, send money or send you to a link not on our links-and-info \n\n" +
                "<a:chartgreen:931902465413120011> There is no surprise mint, free airdrop, or giveaway via DM! We will publicly inform our community with plenty of time to prepare ahead of any events. Don’t get pressured into clicking a link you’re unsure about because you’re scared you’ll miss out on a surprise mint opportunity. \n\n" +
                "<a:chartgreen:931902465413120011> Double check website links and stay skeptical. Better to be safe than sorry. \n\n" +
                "<a:chartgreen:931902465413120011> Our mods and team (visible in the right-hand column) are here to help out")

        client.channels.cache.get(channel).send({embeds: [item], ephemeral: true});
    },
}