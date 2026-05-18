from .globalchat_pkg._cog import GlobalChat

def setup(bot):
    bot.add_cog(GlobalChat(bot))
