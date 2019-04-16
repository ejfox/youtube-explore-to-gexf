## Usage
Run the [youtube-explore]() tool with a command similar to `python2.7 follow-youtube-recommendations.py --query="global warming,vaccines,nasa" --searches=4 --branch=4 --depth=4 --name="science"`

This will generate a JSON file. This tool provides the ability to convert the resulting JSON file to the [.gexf](https://gephi.org/gexf/format/) file format so it can be easily imported into [Gephi](https://gephi.org/)

1. Git clone this repo
1. Copy the JSON file you want to analyze into the folder
1. Run `node convertYoutubeScrapeToGexf.js --filename=video-infos-SOURCE.json > OUTPUT.gexf` to send the output of the conversion to a new file named `OUTPUT.gexf`
1. In Gephi `File > Open` and then select the newly created output .gexf file
1. Analyze your recommendation network with Gephi

## Global installation
This tool is also available as an npm package.

+ `npm install -g youtube-explore-to-gexf`

### Usage
+ `youtube-explore-to-gexf --filename=video-infos-SOURCE.json > OUTPUT.gexf`

## How it works
We are going to convert the output JSON of a YouTube recommendation scrape performed with https://github.com/pnbt/youtube-explore

Let's load the file
```javascript
var fs = require('fs') // To load things from filesystem
var _ = require('lodash') // To process data
var filename = 'data/video-infos-candidates2020-Andrew Yang-20190415.json' // File to process
var scrape = JSON.parse(fs.readFileSync(filename, 'utf8')) // Load the file
var gexf = require('gexf') // To read and write gexf data
const argv = require('yargs').argv
```

Accept filenames when run through CLI
By adding the flag `--filename=PATH-TO-YOUR-FILE`

#### Example command
`> node convertYoutubeScrapeToGexf.js --filename=data/video-infos-candidates2020-Bernie\ Sanders-20190415.json > bernie.gexf`

## The data
+ At the top level is an array of videos that are the result of the search
+ If you dive into any of these videos... (which have a unique ID like `4U2eDJnwz_s`)

#### You get the following data:
|key | value |
|----|--------|
|pubdate|   "2016-08-14"|
|views|     10545448|
|dislikes|  3374|
|likes|     93179|
|key|       [ (0) ]|
|duration|  1076|
|id|        "4U2eDJnwz_s"|
|mult|      0.8598425196850393|
|title|     "Auto Lending: Last Week Tonight with John Oliver (HBO)"|
|nb_recommendations| 2|
|depth|     1|
|recommendations|    [ (20) video ID strings ]|
|channel|   "LastWeekTonight"|

The unique ID can be used to generate a link to the actual video like so
Example: https://www.youtube.com/watch?v=UNIQUE-ID-HERE
This video's URL: https://www.youtube.com/watch?v=4U2eDJnwz_s  

The `recommendations` key contains an array of 20 more IDs of videos that are recommended from this video

## Converting to GEXF (which is a lot like XML)

Okay, now that we know the general shape of our source data
We need to figure out how to convert it so that it can be read by GEPHI
Or other software through the GEXF graph format
Like most directed graphs, the two main components are
+ Nodes: A list of every entity, in our case YouTube videos
+ Edges: A list of every link between entities, in our case recommendations

## Nodes
Nodes have an ID, a label, and other data can be attached for analysis in GEPHI
You end up with something like `<node id="0" label="Hello" />`

## Links
Links have a unique ID
The "source" field is the unique ID for the source node which in our case is the video that is being recommended from
The "target" field is the unique ID of the recommended video

A hello world GEXF graph would look something like this
```xml
<?xml version="1.0" encoding="UTF-8"?>
<gexf xmlns="http://www.gexf.net/1.2draft" version="1.2">
    <meta lastmodifieddate="2009-03-20">
        <creator>Gexf.net</creator>
        <description>A hello world! file</description>
    </meta>
    <graph mode="static" defaultedgetype="directed">
        <nodes>
            <node id="0" label="Hello" />
            <node id="1" label="Word" />
        </nodes>
        <edges>
            <edge id="0" source="0" target="1" />
        </edges>
    </graph>
</gexf>
```

So let's loop over our JSON file and fill our nodes and links
```javascript
_.each(scrape, function(video) {
  var sourceID = video.id // Get the source video ID
  nodes.push({
    id: sourceID,
    label: video.title,
    attributes: {
      duration: video.duration,
      likes: video.likes,
      dislikes: video.dislikes,
      pubdate: video.pubdate,
      mult: video.mult,
      channel: video.channel
    }
  }) // Add source video as node
  _.each(video.recommendations, function(rec, i) {
    // Generate new links for every recommended video
    var newLink = {
      id: sourceID + '-' + rec + '-' + i,
      source: sourceID,
      target: rec
    }
    links.push(newLink) // Add to our list of links
  })
})
```

So now we have our links and nodes in JSON format
We're going to use the [gexf library](https://github.com/Yomguithereal/gexf#writer)
To convert things

```javascript
var convertedGraph = gexf.create({
  defaultEdgeType: 'directed',
  model: {
    node: [
      {
        id: 'duration',
        type: 'float',
        title: 'likes'
      },
      {
        id: 'likes',
        type: 'float',
        title: 'likes'
      },
      {
        id: 'dislikes',
        type: 'float',
        title: 'dislikes'
      },
      {
        id: 'mult',
        type: 'float',
        title: 'mult'
      },
      {
        id: 'pubdate',
        type: 'string',
        title: 'pubdate'
      },
      {
        id: 'channel',
        type: 'string',
        title: 'channel'
      }
    ]
  },
  nodes: nodes,
  edges: links
})
```

# Made by EJ Fox 🌞
#### Apr 16, 2019

ejfox@ejfox.com // Questions, comments, collaboration welcome

Support for my work is appreciated! https://ejfox.com/donate/
