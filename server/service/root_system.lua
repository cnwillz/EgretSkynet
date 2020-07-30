local skynet = require "skynet"
local tiny = require "tiny"
local cmd = require "cmd"

local world = tiny.world()

local CMD = {}

function ends(String,End)
    return End=='' or string.sub(String,-string.len(End))==End
end

-- 分隔字符串
function string:split(sep)
    local sep, fields = sep or "\t", {}
    local pattern = string.format("([^%s]+)", sep)
    self:gsub(pattern, function(c) fields[#fields+1] = c end)
    return fields
end

function getFileName(str)
    local a = str:split('\\')
    local f0 = a[#a]
    local b = f0:split('.')
    return b[1]
end

function CMD.init()
    print("init all system")

    -- add systems
    local platform = cmd.system()
    if platform == "win" then
        local cmd = string.format("dir /S %s /b","src\\system")
        local fp = io.popen(cmd)
        for filename in fp:lines() do
            if ends(filename, ".lua") then
                local system = require("system."..getFileName(filename))
                world:addSystem(system)
            end
        end
        fp:close()   
    else

    end

    
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