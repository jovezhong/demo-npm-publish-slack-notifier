module.exports = async ({ kafka, config, slack }) => {
  const consumer = kafka.consumer(config.consumer);

  await consumer.connect();
  await consumer.subscribe({ topic: config.app.topicToReact, fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const { _emit_time, _time, number } = JSON.parse(message.value.toString());
      const _timeLong=Date.parse(_time);
      const gap=Date.parse(_emit_time)-_timeLong;
      const text=`:alert: You just got the magic number \`${number}\` at <!date^${_timeLong/1000|0}^{time_secs} {date_short_pretty}|bak>, with ${gap}ms latency since the data is generated\n<https://timeplus.io|Check more details in Timeplus>`;
      await slack.send({
        text,
        username: "Timeplus bot",
      });
    },
  });

  return consumer;
};
