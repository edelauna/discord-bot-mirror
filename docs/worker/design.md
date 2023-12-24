# Worker Design

The `worker` directory will contain code related to compute intensive operations to be performed by the application, and incorporated into a workflow.

## Decisions

**Temporal Typescript SDK**: will be used to coordinate work related to copying messages from activated channels. Planning to have each worker reference it's own sqlite db file, rather then a centralized server. Need to figure out archiving.

**Azure Blob Storage**: Will use Azure Block Blobs and Queues as storage to support worker operations, since it had the lowest pricing, and the ability to set differant tiers for blob storage.

**Github Actions**: Since all workflows could be performed asynchronously we'll leverage github actions to run an instance of the temporal service, and differant workers to perform tasks.

**Rate Limit Considerations**:

- Discord App has a global rate limit of 50 requests per second
- Github Actions allows for 20 concurrent jobs to be run at a time on the free account.
- Azure Block Blob's are limited to 50,000 Blocks

### Reusable Logic for Range Queries and Block Blob Distributed Hash Table

**Assumptions:**

1. Range query represent blobs where the blockid is a timestamp, and content represents where to find the appropriate Distributed Hash Table:

   1. `blockids` will be sorted by timestamp
   2. Parent Blobs will be included as a Blob Tag

1. Distributed Hash Table where the blockid is a SnowFlakeId and block contains the contents(value) related to the id
1. `getBlockList`: Can return two types of Block Ids formats:
   1. 41 bit timestamps based on [SnowFlakeId](https://en.wikipedia.org/wiki/Snowflake_ID) for Index Blobs
   1. SnowFlakeId for a Distributed Hash Table
1. `Expression` respresents a [Query acceleration: SQL language reference](https://learn.microsoft.com/en-us/azure/storage/blobs/query-acceleration-sql-reference)
1. Using JSON (instead of CSV) for content to allow for unstructured data in case objects need to change over time.

```mermaid
---
title: Range Query for Distributed Hash Table Lookup
---
flowchart TD
    search("Search for `id`: SnowflakeId", `lookupQuery`:Expression, `root`: BlockBlob) --> getBlockList["Get Block List for `root` Blob"]
    getBlockList --> areSnowFlakeIds{ }
    areSnowFlakeIds --> |`blockids` are SnowFlakes| valueFound{ }
    valueFound --> |`id` exists in `blockids`| lookup["Query Blob Contents"]
    valueFound --> |`id` not found in `blockids`| retF(return False)
    areSnowFlakeIds --> |`blockids` are timestamps| getBlockId["Find largest `blockid` < `id`"]
    getBlockId --> query["Query Index Blob Contents for `newRoot`"]
    query --> search2
    search2("return search(id, lookupQuery, newRoot)") --> search
    lookup --> retResults(return `results`)
```

```mermaid
---
title: Upsert Range Query for Distributed Hash Table
---
flowchart TD
    upsert("Upsert for `id`: SnowflakeId", `content`: JSON, `root`: BlockBlob, `blockId`: TimeStamp?,  `ref`: BlockBlob?) --> leaseBlob
    leaseBlob[Lease Blob] --> getBlockList["Get Block List for `root` Blob"]
    getBlockList --> areSnowFlakeIds{ }
    areSnowFlakeIds --> |`blockids` are SnowFlakes| valueFound{ }
    valueFound --> |`id` exists in `blockids`| putBlock["Put `content` Block"]
    valueFound --> |`id` not found in `blockids`| currentSize{ }
    currentSize --> |currentSize < 50_000| putBlock
    currentSize --> |currentSize == 50_000| putBlob["Put Blob"]
    putBlob --> putBlock2["Put `content` Block"]
    putBlock2 --> putBlockList2["Put Block List"]
    putBlockList2 --> updateRangeQuery["updateRangeQuery(`ref`, `blockid`, `minId`, `newBlob`, `root`)"]
    areSnowFlakeIds --> |`blockids` are timestamps| getBlockId["Find next largest `blockid` after `id`"]
    getBlockId --> query["Query Block Contents for `newRoot`"]
    query --> upsert2
    upsert2["upsert(`id`, `content`, `newRoot`, `blockid`, `root`)"] -. recursive call keeping lease active .-> upsert
    upsert2 --> releaseLease
    putBlock --> putBlockList[Put BlockList]
    putBlockList --> updateRangeQuery
    updateRangeQuery --> releaseLease["Release Lease"]
    releaseLease --> ret(return `True`)
```

```mermaid
---
title: Update Range Query Reference
---
flowchart TD
    updateRangeQuery("update(`ref`: BlockBlob, `blockid`: Timestamp, `newId`: Timestamp, `newBlob`: BlockBlob?, `oldBlob`: BlockBlob)") --> getBlockList["Get Block List for `ref` Blob"]
    getBlockList --> isThereNewBlob{ }
    isThereNewBlob --> |adding `newBlob`| currentSize{ }
    currentSize --> |current blocklist == 50_000 | putBlob[Put New Range QueryBlob]
    putBlob --> headsOrTails{ }
    headsOrTails --> |adding to head| putBlock3[Put Block\n`newId` -> `newBlob`]
    putBlock3 --> putBlock4["Put Block\n`blockid` -> `oldBlob`"]
    putBlock4 --> putBlockList3[Put RangeQuery Block List]
    putBlockList3 --> putBlock5["Put Block\n`newId` -> `newRangeQueryBlob`"]
    putBlock5 --> putBlockList2["Put Block List\nexcluding min(blockids)"]
    headsOrTails --> |adding to tail| copy["Copy\n`ref` Blob to `newRangeQueryBlob`"]
    copy --> putBlock6["Put Block\nmin(`blockid`) -> `newRangeQueryBlob` "]
    putBlock6 --> putBlock7["Put Block\n`newId` -> `newBlob`"]
    putBlock7 --> putBlockList4["Put Block List\nonly min(`blockid`) + `newId`"]
    currentSize --> |current blocklist is < 50_000| putBlock[Put Block\n`newId` -> `newBlob`]
    isThereNewBlob --> |updating `blockid`| putBlock2[Put Block\n`newId` -> `oldBlob`]
    putBlock2 --> putBlockList2["Put Block List\nexcluding `blockid`"]
    putBlock --> putBlockList[Put Block List]
    putBlockList --> return( )
    putBlockList4 --> return
    putBlockList2 --> return
```

### Channel Watcher Worker

```mermaid
---
title: Add Channel to Channel Watcher Workflow
---
flowchart TD
    read(Read 'Add Channel Queue') --> checkForMessage{ }
    checkForMessage --> |No Message| done( )
    checkForMessage --> |MessageExists| getChannel["Get Channel: lookup(channel)"]
    getChannel --> found{ }
    found --> |Channel returned| checkStatus{ }
    found --> |No Channel returned| updateChannel["Update Channel: upsert(channel)"]
    updateChannel --> ret( )
```

```mermaid
---
title: Remove Channel from Channel Watcher Workflow
---
flowchart TD
    read(Read 'Remove Channel Queue') --> checkForMessage{ }
    checkForMessage --> |No Message| done( )
    checkForMessage --> |MessageExists| getChannel["Get Channel: lookup(channelId)"]
    getChannel --> found{ }
    found --> |Channel returned| checkStatus{ }
    found --> |No Channel returned| updateChannel["Update Channel: upsert(channelId, null)"]
    updateChannel --> enqueu[Enque `channel_id` to 'Delete Message Queue']
    enqueu --> ret( )
```

```mermaid
---
title: Channel Data Structure
---
classDiagram
    Channel: +String channelId
    Channel: +Snowflake lastMessageId
```

### New Message Worker

```mermaid
---
title: Channel Watcher Add Messages Worflow
---
flowchart TD
    getChannels[Get Channels] --> forEach[For Each Channel]
    forEach --> getChannel[Get Channel from Discord]
    getChannel --> getLastMessage[Get Last Message]
    getLastMessage --> upsertMessage["upsert(message)"]
    upsertMessage --> enqueu[Enque `channel_id:last_message_id` to 'Add Messages Queue']
    enqueu --> search["search(channel_id)"]
    search --> upsert["upsert({lastMessageId})"]
    upsert --> ret
```

### Delete Message Worker

```mermaid
---
title: Channel Handler for Delete Messages Worflow
---
flowchart TD
    dequeue[channelId from 'Delete Message Queue'] --> getChannel[Get Channel from Discord]
    getChannel --> getLastMessage[Get Last Message]
    getLastMessage --> fetchMessage["search(message)"]
    fetchMessage --> exists{ }
    exists --> |does not exist| enqueu
    exists --> |exists| upsertMessage["upsert(message, null)"]
    upsertMessage --> enqueu[Enque `channel_id:last_message_id` to 'Delete Messages Queue']
    enqueu --> ret( )
```

### Process Message Worker

```mermaid
---
title: Add Messages Worker Worflow
---
flowchart TD
    dequeue[Get `channelId:lastMessageId` from 'Add Messages Queue'] --> getChannelMessage[Get 100 Channel Messages :before]
    getChannelMessage --> forEach[For Each Message]
    forEach --> fetchMessage["search(message)"]
    fetchMessage --> exists{ }
    exists --> |exists| break(break)
    exists --> |does not exist| upsert["upsert(message)"]
    upsert --> isLast{ }
    isLast -..-> |is not last message in batch| forEach
    isLast --> |is last message in batch| enqueu[Enque `channel_id:last_message_id` to 'Process Message Queue']
```

```mermaid
---
title: Delete Messages Worker Worflow
---
flowchart TD
    dequeue[Get `channelId:lastMessageId` from 'Delete Messages Queue'] --> getChannelMessage[Get 100 Channel Messages :before]
    getChannelMessage --> forEach[For Each Message]
    forEach --> fetchMessage["search(message)"]
    fetchMessage --> exists{ }
    exists --> |does not exist| isLast
    exists --> |exists| upsert["upsert(message, null)"]
    upsert --> isLast{ }
    isLast -..-> |is not last message in batch| forEach
    isLast --> |is last message in batch| enqueu[Enque `channel_id:last_message_id` to 'Delete Messages Queue']
```

### Update Message Worker

> [!NOTE]
> Individual messages which need to be deleted or edited will require to be manually flagged in the front end, as the Discord Audit Log does not provide insights into all Message Delete and Edit events.

```mermaid
---
title: Channel Handler for Delete Messages Worflow
---
flowchart TD
    dequeue[channelId:messageId from 'Review Message Queue'] --> fetchMessage["Get Message from Discord"]
    fetchMessage --> exists{ }
    exists --> |does not exist| upsert(message, null)
    exists --> |exists| upsertMessage["upsert(message)"]
    upsertMessage --> ret( )
    upsert --> ret
```

### Storage Tier Worker

```mermaid
---
title: Update Storage Tier Worker
---
flowchart TD
    getBlobs(Get Blobs By Tiers) --> tierType{ }
    tierType --> |Hot| forEachHotTierBlob[For Each Hot Tier Blob]
    forEachHotTierBlob --> getProperties[Get Blob Properties]
    getProperties --> checkHotLastModified{ }
    checkHotLastModified --> |x-ms-last-access-time\n> 15 days ago| downgradeCool[Downgrade to Cool]
    checkHotLastModified --> |x-ms-last-access-time\n<= 15 days ago| ret( )
    downgradeCool --> ret
    tierType --> |Cool| forEachCoolTierBlob[For Each Cool Tier Blob]
    forEachCoolTierBlob --> getCoolProperties[Get Blob Properties]
    getCoolProperties --> checkCoolLastModified{ }
    checkCoolLastModified --> |x-ms-last-access-time\n> 45 days ago| downgradeCold[Downgrade to Cold]
    checkCoolLastModified --> |x-ms-last-access-time\n<= 45 days ago| upgradeHot[Upgrade to Hot]
    downgradeCold --> ret
    upgradeHot --> ret
    tierType --> |Cold| forEachColdTierBlob[For Each Cold Tier Blob]
    forEachColdTierBlob --> getColdProperties[Get Blob Properties]
    getColdProperties --> checkColdLastModified{ }
    checkColdLastModified --> |x-ms-last-access-time\n> 90 days ago| ret
    checkColdLastModified --> |x-ms-last-access-time\n<= 90 days ago| upgradeHot[Upgrade to Hot]
```
