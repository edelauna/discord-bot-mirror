# Bot Design

The `bot` directory will contain all the related code for discord app portion of discord-mirror.

## Decisions

**Cloudflare Worker**: Choosing Cloudflare worker due to ability to to avoid cold starts, and pricing looked to be the best overall. Limitations means functionality is limited to the quasi-node environment provided by Cloudflare. Will develop the app in typescript, in addition to the features listed below will also need to verify messages actually came from discord via signature check.

**Azure Blob Storage**: Will use Azure BlockBlob and Queue storage to support bot operations, since it had the lowest pricing, after incorporating transfer fees.

### Blob Storage Flow for Simple Caching

Not shown is Cache BlockBlob intialization. Will be set with a tag `HotTier` for `StorageTierWorker`.

```mermaid
classDiagram
    BlockId : +String blockid
    ChannelId : +Snowflake id
    Uncommited : +BlockId[] add
    Uncommited : +BlockId[] remove
    CacheBlockBlob : +ChannelId blockid
    CacheBlockBlob : +boolean value=true
```

```mermaid
---
title: Update Uncommited Flow
---
flowchart TD
    start("updateWithUncommited(blockids)") --> exists{ }
    exists --> |Uncommited object entries exists| update[Update `blockids` with uncommited entries]
    exists --> |No uncommited objects entries exists| ret0(return `blockids`)
    update --> ret(return new `blockids`)
```

```mermaid
---
title: Cache Flow
---
flowchart TD
    cache("cache(result)") --> putBlock[Put Cache Block]
    putBlock --> leaseBlob[Lease Blob]
    leaseBlob --> leaseSucces{ }
    leaseSucces --> |success| getBlockList[Get Block List]
    getBlockList --> updateUncommited[["updateWithUncommited(blockids)"]]
    updateUncommited --> putBlockList[Put Block List]
    putBlockList --> releaseLease[Release Lease]
    releaseLease --> ret( )
    leaseSucces --> |fail| addUncommited[Add `blockid` to Uncommited.add object]
    addUncommited --> ret( )
```

```mermaid
---
title: Evict Flow
---
flowchart TD
    cache("evict(result)") --> leaseBlob[Lease Blob]
    leaseBlob --> leaseSucces{ }
    leaseSucces --> |success| getBlockList[Get Block List]
    getBlockList --> updateUncommited[["updateWithUncommited(blockids)"]]
    updateUncommited --> putBlockList["Put Block List"]
    putBlockList --> releaseLease[Release Lease]
    releaseLease --> ret( )
    leaseSucces --> |fail| addUncommited[Add `blockid` to Uncommited.remove object]
    addUncommited --> ret( )
```

```mermaid
---
title: Cron Cache Update Flow
---
flowchart TD
    cron("Cache Update Cron") --> leaseBlob[Lease Blob]
    leaseBlob --> leaseSucces{ }
    leaseSucces --> |success| getBlockList[Get Block List]
    getBlockList --> updateUncommited[["updateUncommited(blockids)"]]
    updateUncommited --> any{ }
    any --> |blockids_in != blockids_out| putBlockList["Put Block List"]
    any --> |blockids_in = blockids_out| ret( )
    putBlockList --> releaseLease[Release Lease]
    releaseLease --> ret( )
    leaseSucces --> |fail| ret( )
```

### Ability to Add Channel

Adds a channel id to a queue to be processed by the worker, which will eventually allow for messages to be copied from this channel.

```mermaid
---
title: Add Channel for Messages to be Copied
---
flowchart TD
    inc(Add Channel) --> |Add Channel Queue| enque[Queue Channel Id]
    enque --> cache[["cache(channelId)"]]
    cache --> ret(return ok)
```

### Ability to Remove Channel

Removing a channel will also delete all the messages. This might need to be revised depending on the costs of compute to re-add the messages vs. the cost of storing the messages, and marking them deleted.

```mermaid
---
title: Remove Channel for Messages to be deleted
---
flowchart TD
    inc(Remove Channel) --> |Remove Channel Queue| enque[Queue Channel Id]
    enque --> remove[["remove(channelId)"]]
    remove -->ret(return ok)
```

### Return Channel Status

Returns the channel's status

```mermaid
---
title: Remove Channel for Messages to be deleted
---
flowchart TD
    inc(Check Channel Cache Blog, or Uncommited Object) --> exists{ }
    exists --> | key exists | retT(active)
    exists --> | key does not exists| retF(inactive)
```
