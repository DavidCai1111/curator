-- getJob
-- KEYS[1] job name

local objName = 'curator:jobs'

local result = redis.call('hget', objName, KEYS[1])

if result == nil then
  result = nil
end

redis.call('hdel', objName, KEYS[1])

return result
