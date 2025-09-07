// Custom transformer for Cerebras to handle Claude Code's message format

function convertContentToString(content) {
  if (typeof content === 'string') {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map(item => {
        if (typeof item === 'string') {
          return item;
        }
        if (item.type === 'text' && item.text) {
          return item.text;
        }
        return '';
      })
      .join('');
  }
  return '';
}

class CerebrasTransformer {
  constructor() {
    this.name = 'cerebras';
  }
  transformRequestIn(request) {
    console.log("Original request": request);
    const transformedRequest = JSON.parse(JSON.stringify(request));
    if (transformedRequest.messages && Array.isArray(transformedRequest.messages)) {
      transformedRequest.messages = transformedRequest.messages.map(message => {
        const transformedMessage = { ...message };
        if (message.content !== undefined) {
          transformedMessage.content = convertContentToString(message.content);
        }
        if (message.role === 'system' && message.content !== undefined) {
          transformedMessage.content = convertContentToString(message.content);
        }
	console.info("exit 1" + transformedMessage);
        return transformedMessage;
      });
    }
    if (transformedRequest.system !== undefined) {
      transformedRequest.system = convertContentToString(transformedRequest.system);
    }
    console.info("exit 2" + transformedMessage);
    return transformedRequest;
  }
  async transformResponseOut(response) {
    // Cerebras responses should be compatible with Claude Code
    // No transformation needed
    console.info(response);
    return response;
  }
}

module.exports = CerebrasTransformer;
module.exports.default = CerebrasTransformer;

