-- getJob
-- KEYS[1] job name

local objName = 'curator:jobs'

local result = redis.call('hget', objName, KEYS[1])

if result == nil then
  return nil
end

return redis.call('hdel', objName, KEYS[1])
