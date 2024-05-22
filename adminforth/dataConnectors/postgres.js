import { AdminForthTypes } from '../types.js';
import dayjs from 'dayjs';
import pkg from 'pg';
const { Client } = pkg;


class PostgresConnector {
    constructor({ url }) {
      this.db = new Client({
        connectionString: url
      })
      console.log('PostgresConnector', this.db);
    }

    async discoverFields(tableName) {
        console.log('discoverFields', tableName);
    }

    getFieldValue(field, value) {
        console.log('getFieldValue', field, value);
    }

    setFieldValue(field, value) {
        console.log('setFieldValue', field, value);
    }

    close() {
        return
    }
}

export default PostgresConnector;