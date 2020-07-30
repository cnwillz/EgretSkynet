local CMD = {}

-- function CMD.list(path)
--     local cmd = string.format("dir /S %s /b",path)
-- 	local fp = io.popen(cmd)
--     for filename in fp:lines() do
--         if not string.find(filename, "language") and ends(filename, ".config") then
--             -- print(filename)
-- 			-- LoadConfig(filename,{LAN = LAN})
-- 		end
-- 	end
-- end

function CMD.system()
    local fp = io.popen("ver")
    local s = fp:read("*all")
    if string.find(s, "Windows") then
        return "win"
    else
        return "other"
    end
end

return CMD