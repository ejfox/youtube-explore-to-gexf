#!/usr/bin/env node

// The data
// We are going to convert the output JSON of a YouTube recommendation
// scrape performed with https://github.com/pnbt/youtube-explore

// Let's load the file
var fs = require('fs') // To load things from filesystem
var _ = require('lodash') // To process data
var filename = 'data/video-infos-TEST-20190415.json' // File to process
var scrape = JSON.parse(fs.readFileSync(filename, 'utf8')) // Load the file
var gexf = require('gexf') // To read and write gexf data
const argv = require('yargs').argv

// Accept filenames when run through CLI
// By adding the flag --filename=PATH-TO-YOUR-FILE
// > node convertYoutubeScrapeToGexf.js --filename=data/video-infos-candidates2020-Bernie\ Sanders-20190415.json > bernie.gexf
if (argv.filename) {
  filename = argv.filename
} else {
  console.log('No filename provided!')
  process.exit(1)
}
// At the top level is an array of videos that are the result of the search
// If you dive into any of these videos (which have a unique ID like `4U2eDJnwz_s`)
// console.log(scrape[0])
// You get the following data:
// ---------------------------------
// │pubdate            "2016-08-14"
// │views              10545448
// │dislikes           3374
// │likes              93179
// │key                [ (0) ]
// │duration           1076
// │id                 "4U2eDJnwz_s"
// │mult               0.8598425196850393
// │title              "Auto Lending: Last Week Tonight with John Oliver (HBO)"
// │nb_recommendations 2
// │depth              1
// │recommendations    [ (20) ]
// │channel            "LastWeekTonight"

// The unique ID can be used to generate a link to the actual video like so:
// https://www.youtube.com/watch?v=UNIQUE-ID-HERE
// https://www.youtube.com/watch?v=4U2eDJnwz_s // This video's URL

// The `recommendations` key contains an array of 20 more IDs of videos
// That are recommended from this video

// Converting to GEXF (which is a lot like XML)

// Okay, now that we know the general shape of our source data
// We need to figure out how to convert it so that it can be read by GEPHI
// Or other software through the GEXF graph format
// Like most directed graphs, the two main components are
// Nodes: A list of every entity, in our case YouTube videos
// Edges: A list of every link between entities, in our case recommendations

// Nodes:
// Nodes have an ID, a label, and other data can be attached for analysis in GEPHI
// You end up with something like <node id="0" label="Hello" />
var nodes = []

// Links:
// Links have a unique ID
// The "source" field is the unique ID for the source node
// which in our case is the video that is being recommended from
// The "target" field is the unique ID of the recommended video
var links = []

// A hello world GEXF graph would look something like this
// <?xml version="1.0" encoding="UTF-8"?>
// <gexf xmlns="http://www.gexf.net/1.2draft" version="1.2">
//     <meta lastmodifieddate="2009-03-20">
//         <creator>Gexf.net</creator>
//         <description>A hello world! file</description>
//     </meta>
//     <graph mode="static" defaultedgetype="directed">
//         <nodes>
//             <node id="0" label="Hello" />
//             <node id="1" label="Word" />
//         </nodes>
//         <edges>
//             <edge id="0" source="0" target="1" />
//         </edges>
//     </graph>
// </gexf>

// So let's loop over our JSON file and fill our nodes and links
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

// So now we have our links and nodes in JSON format
// We're going to use the `gexf` library https://github.com/Yomguithereal/gexf#writer
// To convert things
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

// And then, I guess, output the resulting XML to the console
var gexfString = convertedGraph.serialize()

console.log(gexfString)
