// Shared alias for all shells
const path = require('path')

module.exports = {
  src: path.resolve(__dirname, '../src'),
  views: path.resolve(__dirname, '../src/devtools/views'),
  components: path.resolve(__dirname, '../src/devtools/components'),
  microcosm: path.resolve(__dirname, '../../microcosm/build'),
  'microcosm-dom': path.resolve(__dirname, '../../microcosm-dom/build')
}
