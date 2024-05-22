import { AdminForthTypes } from '../types.js';
import dayjs from 'dayjs';

class PostgresConnector {
    constructor({ url }) {
        return
      // create connection here

    //   this.db = betterSqlite3(url.replace('sqlite://', ''));
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