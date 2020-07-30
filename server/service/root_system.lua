local skynet = require "skynet"
local tiny = require "tiny"

local world = tiny.world()

local CMD = {}

function CMD.init()
    print("init all system")

    local talkingSystem = require "system.talking"

    local joe = {
        name = "Joe",
        phrase = "I'm a plumber.",
        mass = 150,
        hairColor = "brown"
    }

    local mike = {
        name = "mike",
        phrase = "I'm a doctor.",
        mass = 100,
        hairColor = "red"
    }

    -- add systems
    world:addSystem(talkingSystem)

    -- add entities
    world:addEntity(joe)
    world:addEntity(mike)
end

function CMD.tick(dt)
    world:update(dt)
end

skynet.start(function()
    print("root system start")
    skynet.dispatch("lua", function(_,_, command, ...)
		local f = CMD[command]
		skynet.ret(skynet.pack(f(...)))
	end)
end)