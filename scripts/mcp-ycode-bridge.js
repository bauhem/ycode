/* global console, process, URL */
const sseUrl = 'https://admin.bauhem.com/ycode/mcp/ymc_52a82598e8378c031abad8000c08638a92f62115e464ba49';

async function main() {
  const { StreamableHTTPClientTransport } = await import('@modelcontextprotocol/sdk/client/streamableHttp.js');
  const { StdioServerTransport } = await import('@modelcontextprotocol/sdk/server/stdio.js');

  const transport = new StreamableHTTPClientTransport(new URL(sseUrl));
  const stdioTransport = new StdioServerTransport();

  await transport.start();
  await stdioTransport.start();

  stdioTransport.onmessage = (message) => {
    transport.send(message).catch(err => console.error('Error sending to SSE:', err));
  };

  transport.onmessage = (message) => {
    stdioTransport.send(message).catch(err => console.error('Error sending to Stdio:', err));
  };

  transport.onclose = () => process.exit(0);
  stdioTransport.onclose = () => process.exit(0);
}

main().catch((err) => {
  console.error('Bridge error:', err);
  process.exit(1);
});
