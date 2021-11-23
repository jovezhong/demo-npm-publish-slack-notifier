const createHookReceiver = require("npm-hook-receiver");

module.exports = ({ producer, config }) => {
  const server = createHookReceiver({
    secret: config.secret,
    mount: config.mount,
  });

  server.on(
    "package:publish",
    async ({ name: package, version, time: timestamp }) => {
      console.log("Received webhook event", {
        package,
        version,
        timestamp,
      });

      try {
        await producer.send({
          topic: config.topicToSend,
          messages: [
            {
              key: package,
              value: JSON.stringify({
                package,
                version,
                timestamp,
              }),
            },
          ],
        });
      } catch (error) {
        console.error(`Failed to publish webhook message`, error);
      }
    }
  );

  //reuse this restify server for the web page and actions
  function respondHome(req,res,next) {
    res.sendRaw('<html><head><title>Demo Page</title></head><body><iframe style="display: none;" name=theFrame></iframe><p>Hey there. Please click a button:</p><div style="display:flex"><form action=send/10 method=post target=theFrame style="padding: 0 12px"><button>10 USD</button></form><form action=send/20 method=post target=theFrame style="padding: 0 12px"><button>20 USD</button></form><form action=send/30 method=post target=theFrame style="padding: 0 12px"><button>30 USD</button></form><form action=send/40 method=post target=theFrame style="padding: 0 12px"><button>40 USD</button></form><form action=send/50 method=post target=theFrame style="padding: 0 12px"><button>50 USD</button></form></div></body></html>');
    next();
  }
  server.get('/', respondHome);
  function respondSend(req,res,next) {
    try {
      producer.send({
        topic: config.topicToSend,
        messages: [
          {
            key: 'key',
            value: JSON.stringify({
              _time: new Date().toISOString(),//.replace(/T/, ' ').replace(/\..+/, ''),
              number: parseInt(req.params.number)
            }),
          },
        ],
      });
    } catch (error) {
      console.error(`Failed to publish webhook message`, error);
    }
    res.sendRaw('got number '+req.params.number);
    next();
  }
  server.post('/send/:number', respondSend);
  

  return server;
};
