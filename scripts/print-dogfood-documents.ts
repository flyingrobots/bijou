import { documentTable } from './dogfood-documents.js';

// Prints the table of documents DOGFOOD reads as one JSON object, for the
// showcase's build to read; it is not committed anywhere.
process.stdout.write(JSON.stringify(documentTable()));
