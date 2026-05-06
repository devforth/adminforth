import request from 'supertest';
import { agent, app, closeApplication } from './testApp';

let authCookie: string;

afterAll(async () => {
  await closeApplication();
});

describe('POST /create_record', () => {
  const requestBody: any ={
    "resourceId": "cars_sl",
    "record": {
        "model": "Abobus amogus",
        "price": "1234",
        "engine_type": "gasoline",
        "engine_power": 1234,
        "production_year": 2000,
        "description": "1234",
        "listed": true,
        "mileage": 1234,
        "color": "Blue",
        "body_type": "sedan"
    },
    "requiredColumnsToSkip": [],
    "meta": {}
  };

  
  beforeAll(async () => {
    const res = await agent
      .post('/adminapi/v1/login')
      .send({
        username: 'adminforth',
        password: 'adminforth',
      });
    expect(res.status).toEqual(200);
    authCookie = res.headers['set-cookie']?.[0]?.split(';')[0];
    expect(authCookie).toContain('adminforth_');
  });

  it('blocks create_record for unauthenticated requests', async () => {
    const res = await request(app)
      .post('/adminapi/v1/create_record')
      .send({
        ...requestBody,
        resourceId: 'cars_sl',
      });
    expect(res.status).toEqual(401);
  });

  it('throw an error, that resource is not found', async () => {
    const res = await agent
      .set('Cookie', authCookie)
      .post('/adminapi/v1/create_record')
      .send({
        ...requestBody,
        resourceId: 'non_existent_resource',
      });
    expect(res.status).toEqual(200);
    expect(res.body.error).toBe("Resource 'non_existent_resource' not found");
  });

  it('throw an error, that resource is not found', async () => {
    const res = await agent
      .set('Cookie', authCookie)
      .post('/adminapi/v1/create_record')
      .send({
        ...requestBody,
        resourceId: 'cars_sl_no_create',
      });
    expect(res.status).toEqual(200);
    expect(res.body.error).toBe("Action is not allowed");
  });

  it('throw an error, that column is required', async () => {
    const res = await agent
      .set('Cookie', authCookie)
      .post('/adminapi/v1/create_record')
      .send({
        ...requestBody,
        resourceId: 'cars_sl',
        record: {
          ...requestBody.record,
          mileage: undefined,
        }
      });
    expect(res.status).toEqual(200);
    expect(res.body.error).toBe("Column 'mileage' is required");
  });

  let createdRecordId: string;
  it('should skip required column (NEEDS TO BE FIXED)', async () => {
    const res = await agent
      .set('Cookie', authCookie)
      .post('/adminapi/v1/create_record')
      .send({
        ...requestBody,
        resourceId: 'cars_sl',
        record: {
          ...requestBody.record,
          mileage: undefined,
        },
        requiredColumnsToSkip: [{name: 'mileage', }],
      });
    createdRecordId = res.body.newRecordId;
    expect(res.status).toEqual(200);
    expect(res.body.error).toBeUndefined();
  });

  it('throw an error, that record with existing id cannot be created', async () => {
    const res = await agent
      .set('Cookie', authCookie)
      .post('/adminapi/v1/create_record')
      .send({
        ...requestBody,
        resourceId: 'cars_sl',
        record: {
          ...requestBody.record,
          id: createdRecordId,
        },
      });
    expect(res.status).toEqual(200);
    expect(res.body.error).toBe(`Record with id '${createdRecordId}' already exists`);
  });

  it('throw an error, that backend only field cannot be modified', async () => {
    const res = await agent
      .set('Cookie', authCookie)
      .post('/adminapi/v1/create_record')
      .send({
        ...requestBody,
        resourceId: 'cars_sl',
        record: {
          ...requestBody.record,
          secret_field: 'some value',
        },
      });
    expect(res.status).toEqual(200);
    expect(res.body.error).toBe(`Field "secret_field" cannot be modified as it is restricted from creation (backendOnly is true).`);
  });

  it('throw an error, that field is hidden from create view', async () => {
    const res = await agent
      .set('Cookie', authCookie)
      .post('/adminapi/v1/create_record')
      .send({
        ...requestBody,
        resourceId: 'cars_sl',
        record: {
          ...requestBody.record,
          photos: ['photo1.jpg', 'photo2.jpg'],
        },
      });
    expect(res.status).toEqual(200);
    expect(res.body.error).toBe(`Field \"photos\" cannot be modified as it is restricted from creation (showIn.create is false). If you need to set this hidden field during creation, either configure column.fillOnCreate or set column.allowModifyWhenNotShowInCreate = true.`);
  });

  it('throw an error, that model is doesn`t fit regex', async () => {
    const res = await agent
      .set('Cookie', authCookie)
      .post('/adminapi/v1/create_record')
      .send({
        ...requestBody,
        resourceId: 'cars_sl',
        record: {
          ...requestBody.record,
          model: "Abobus",
        },
      });
    expect(res.status).toEqual(200);
    expect(res.body.error).toBe(`Model must contain at least two words`);
  });

  it('throw an error, that value can`t be less than minValue', async () => {
    const res = await agent
      .set('Cookie', authCookie)
      .post('/adminapi/v1/create_record')
      .send({
        ...requestBody,
        resourceId: 'cars_sl',
        record: {
          ...requestBody.record,
          production_year: 1800,
        },
      });
    expect(res.status).toEqual(200);
    expect(res.body.error).toBe(`Value in \"production_year\" must be greater than 1900`);
  });


  it('throw an error, that value can`t be greater than maxValue', async () => {
    const res = await agent
      .set('Cookie', authCookie)
      .post('/adminapi/v1/create_record')
      .send({
        ...requestBody,
        resourceId: 'cars_sl',
        record: {
          ...requestBody.record,
          production_year: 3000,
        },
      });
    expect(res.status).toEqual(200);
    expect(res.body.error).toBe(`Value in \"production_year\" must be less than ${new Date().getFullYear()}`);
  });

  it('throw an error, that create action is not allowed by hook', async () => {
    const res = await agent
      .set('Cookie', authCookie)
      .post('/adminapi/v1/create_record')
      .send({
        ...requestBody,
        resourceId: 'cars_sl_no_create_by_hook',
        record: {
          ...requestBody.record,
        },
      });
    expect(res.status).toEqual(200);
    expect(res.body.error).toBe(`Operation aborted by hook`);
  });


  it('normal create record', async () => {
    const res = await agent
      .set('Cookie', authCookie)
      .post('/adminapi/v1/create_record')
      .send({
        ...requestBody,
          resourceId: 'cars_sl',
      });
    createdRecordId = res.body.newRecordId;
    expect(res.status).toEqual(200);
    expect(res.body.error).toBeUndefined();

    const getRes = await agent
      .set('Cookie', authCookie)
      .post('/adminapi/v1/get_resource_data')
      .send({
        filters: [{field: "id", operator: "eq", value: createdRecordId}],
        limit: 1,
        offset: 0,
        resourceId: 'cars_sl',
        sort: [],
        source: "show",
      })
    expect(getRes.status).toEqual(200);
    expect(getRes.body.data[0]).toMatchObject({
      id: createdRecordId,
      model: "Abobus amogus",
      price: 1234,
      engine_type: "gasoline",
      engine_power: 1234,
      production_year: 2000,
      description: "1234",
      listed: true,
      mileage: 1234,
      color: "Blue",
      body_type: "sedan",
    });
  });
});


















describe('POST /update_record', () => {
  const requestBody: any ={
    "resourceId": "cars_sl",
    "record": {
        "model": "Abobus amogus",
        "price": "1234",
        "engine_type": "gasoline",
        "engine_power": 1234,
        "production_year": 2000,
        "description": "1234",
        "listed": true,
        "mileage": 1234,
        "color": "Blue",
        "body_type": "sedan"
    },
    "requiredColumnsToSkip": [],
    "meta": {}
  };

    
  beforeAll(async () => {
    const res = await agent
      .post('/adminapi/v1/login')
      .send({
        username: 'adminforth',
        password: 'adminforth',
      });
    expect(res.status).toEqual(200);
    authCookie = res.headers['set-cookie']?.[0]?.split(';')[0];
    expect(authCookie).toContain('adminforth_');
  });

  let createdRecordId: string;
  let createdRecordId_noEdit: string;
  let createdRecordId_noEdit_by_hook: string;

  it('normal create record', async () => {
    const res = await agent
      .set('Cookie', authCookie)
      .post('/adminapi/v1/create_record')
      .send({
        ...requestBody,
          resourceId: 'cars_sl',
      });
    createdRecordId = res.body.newRecordId;
    expect(res.status).toEqual(200);
    expect(res.body.error).toBeUndefined();
    
    //record to check allowed actions
    await agent
      .set('Cookie', authCookie)
      .post('/adminapi/v1/create_record')
      .send({
        ...requestBody,
          resourceId: 'cars_sl_no_edit',
      });
    createdRecordId_noEdit = res.body.newRecordId;
    expect(res.status).toEqual(200);
    expect(res.body.error).toBeUndefined();
    //____________________________________

    //record to hook block
    await agent
      .set('Cookie', authCookie)
      .post('/adminapi/v1/create_record')
      .send({
        ...requestBody,
          resourceId: 'cars_sl_no_edit_by_hook',
      });
    createdRecordId_noEdit_by_hook = res.body.newRecordId;
    expect(res.status).toEqual(200);
    expect(res.body.error).toBeUndefined();
    //____________________________________

    const getRes = await agent
      .set('Cookie', authCookie)
      .post('/adminapi/v1/get_resource_data')
      .send({
        filters: [{field: "id", operator: "eq", value: createdRecordId}],
        limit: 1,
        offset: 0,
        resourceId: 'cars_sl',
        sort: [],
        source: "show",
      })
    expect(getRes.status).toEqual(200);
    expect(getRes.body.data[0]).toMatchObject({
      id: createdRecordId,
      model: "Abobus amogus",
      price: 1234,
      engine_type: "gasoline",
      engine_power: 1234,
      production_year: 2000,
      description: "1234",
      listed: true,
      mileage: 1234,
      color: "Blue",
      body_type: "sedan",
    });
  });
    
  it('should throw error, that resource is not found', async () => {
    const res = await agent
      .set('Cookie', authCookie)
      .post('/adminapi/v1/update_record')
      .send({
        resourceId: 'non_existent_resource',
        recordId: '21345667',
        meta: {},
        record: {
          model: 'Abobus2',
        },
      });
    expect(res.status).toEqual(200);
    expect(res.body.error).toBe("Resource 'non_existent_resource' not found");
  });

  it('should throw error, that record with id "21345667" is not found', async () => {
    const res = await agent
      .set('Cookie', authCookie)
      .post('/adminapi/v1/update_record')
      .send({
        resourceId: 'cars_sl',
        recordId: '21345667',
        meta: {},
        record: {
          model: "Abobus2",
        },
      });
    expect(res.status).toEqual(200);
    expect(res.body.error).toBe("Record with id 21345667 not found");
  });

  it('should throw error, that action is not allowed', async () => {
    const res = await agent
      .set('Cookie', authCookie)
      .post('/adminapi/v1/update_record')
      .send({
        resourceId: 'cars_sl_no_edit',
        recordId: createdRecordId_noEdit,
        meta: {},
        record: {
          model: "Abobus2",
        },
      });
    expect(res.status).toEqual(200);
    expect(res.body.error).toBe("Action is not allowed");
  });

  it('should throw error, that record with id is already exist', async () => {
    const res = await agent
      .set('Cookie', authCookie)
      .post('/adminapi/v1/update_record')
      .send({
        resourceId: 'cars_sl',
        recordId: createdRecordId,
        meta: {},
        record: {
          model: "Abobus2",
          id: createdRecordId,
        },
      });
    expect(res.status).toEqual(200);
    expect(res.body.error).toBe(`Record with id '${createdRecordId}' already exists`);
  });

  it('should throw error, that we are trying to update a record`s backend only field', async () => {
    const res = await agent
      .set('Cookie', authCookie)
      .post('/adminapi/v1/update_record')
      .send({
        resourceId: 'cars_sl',
        recordId: createdRecordId,
        meta: {},
        record: {
          model: "Abobus2",
          secret_field: "some value",
        },
      });
    expect(res.status).toEqual(200);
    expect(res.body.error).toBe(`Field \"secret_field\" cannot be modified as it is restricted from editing (backendOnly is true).`);
  });

  it('should throw error, that we are trying to update a editReadOnly field', async () => {
    const res = await agent
      .set('Cookie', authCookie)
      .post('/adminapi/v1/update_record')
      .send({
        resourceId: 'cars_sl',
        recordId: createdRecordId,
        meta: {},
        record: {
          model: "Abobus2",
          generated_promo_picture: "some_picture.jpg",
        },
      });
    expect(res.status).toEqual(200);
    expect(res.body.error).toBe(`Field \"generated_promo_picture\" cannot be modified as it is restricted from editing (editReadonly is true).`);
  });

  it('should throw error, that we are trying to update hidden from edit view field', async () => {
    const res = await agent
      .set('Cookie', authCookie)
      .post('/adminapi/v1/update_record')
      .send({
        resourceId: 'cars_sl',
        recordId: createdRecordId,
        meta: {},
        record: {
          model: "Abobus2",
          photos: ["some_picture.jpg"],
        },
      });
    expect(res.status).toEqual(200);
    expect(res.body.error).toBe(`Field \"photos\" cannot be modified as it is restricted from editing (showIn.edit is false). If you need to allow updating this hidden field during editing, set column.allowModifyWhenNotShowInEdit = true.`);
  });

  it('should throw error, that model is doesn`t fit regex', async () => {
    const res = await agent
      .set('Cookie', authCookie)
      .post('/adminapi/v1/update_record')
      .send({
        resourceId: 'cars_sl',
        recordId: createdRecordId,
        meta: {},
        record: {
          model: "Abobus",
        },
      });
    expect(res.status).toEqual(200);
    expect(res.body.error).toBe(`Model must contain at least two words`);
  });

  it('should throw error, that value can`t be less than minValue', async () => {
    const res = await agent
      .set('Cookie', authCookie)
      .post('/adminapi/v1/update_record')
      .send({
        resourceId: 'cars_sl',
        recordId: createdRecordId,
        meta: {},
        record: {
          production_year: 1800,
        },
      });
    expect(res.status).toEqual(200);
    expect(res.body.error).toBe(`Value in \"production_year\" must be greater than 1900`);
  });

  it('should throw error, that value can`t be greater than maxValue', async () => {
    const res = await agent
      .set('Cookie', authCookie)
      .post('/adminapi/v1/update_record')
      .send({
        resourceId: 'cars_sl',
        recordId: createdRecordId,
        meta: {},
        record: {
          production_year: 3000,
        },
      });
    expect(res.status).toEqual(200);
    expect(res.body.error).toBe(`Value in \"production_year\" must be less than ${new Date().getFullYear()}`);
  });

  it('should throw error, that action is not allowed by hook', async () => {
    const res = await agent
      .set('Cookie', authCookie)
      .post('/adminapi/v1/update_record')
      .send({
        resourceId: 'cars_sl_no_edit_by_hook',
        recordId: createdRecordId_noEdit_by_hook,
        meta: {},
        record: {
          model: "Abobus2 amogus2",
        },
      });
    expect(res.status).toEqual(200);
    expect(res.body.error).toBe(`Operation aborted by hook`);
  });

  it('should update record normally', async () => {
    const res = await agent
      .set('Cookie', authCookie)
      .post('/adminapi/v1/update_record')
      .send({
        resourceId: 'cars_sl',
        recordId: createdRecordId,
        meta: {},
        record: {
          model: "Abobus2 amogus2",
          price: "4321",
        },
      });
    expect(res.status).toEqual(200);
    expect(res.body.error).toBeUndefined();

    const getRes = await agent
      .set('Cookie', authCookie)
      .post('/adminapi/v1/get_resource_data')
      .send({
        filters: [{field: "id", operator: "eq", value: createdRecordId}],
        limit: 1,
        offset: 0,
        resourceId: 'cars_sl',
        sort: [],
        source: "show",
      })
    expect(getRes.status).toEqual(200);
    expect(getRes.body.data[0]).toMatchObject({
      id: createdRecordId,
      model: "Abobus2 amogus2",
      price: 4321,
      engine_type: "gasoline",
      engine_power: 1234,
      production_year: 2000,
      description: "1234",
      listed: true,
      mileage: 1234,
      color: "Blue",
      body_type: "sedan",
    });
  });
});

describe('POST /get_resource_data', () => {
  const requestBody: any ={
    "resourceId": "cars_sl",
    "record": {
        "model": "Abobus amogus",
        "price": "1234",
        "engine_type": "gasoline",
        "engine_power": 1234,
        "production_year": 2000,
        "description": "1234",
        "listed": true,
        "mileage": 1234,
        "color": "Blue",
        "body_type": "sedan"
    },
    "requiredColumnsToSkip": [],
    "meta": {}
  };

  let createdRecordId: string;
  let createdRecordId_noRead: string;
  let createdRecordId_noRead_by_hook: string;
  it('create and read ', async () => {
    const res = await agent
      .set('Cookie', authCookie)
      .post('/adminapi/v1/create_record')
      .send({
        ...requestBody,
          resourceId: 'cars_sl',
      });
    createdRecordId = res.body.newRecordId;
    expect(res.status).toEqual(200);
    expect(res.body.error).toBeUndefined();
    //record to check allowed actions
    await agent
      .set('Cookie', authCookie)
      .post('/adminapi/v1/create_record')
      .send({
        ...requestBody,
          resourceId: 'cars_sl_no_show',
      });
    createdRecordId_noRead = res.body.newRecordId;
    expect(res.status).toEqual(200);
    expect(res.body.error).toBeUndefined();
    //____________________________________

    //record to hook block
    await agent
      .set('Cookie', authCookie)
      .post('/adminapi/v1/create_record')
      .send({
        ...requestBody,
          resourceId: 'cars_sl_no_show_by_hook',
      });
    createdRecordId_noRead_by_hook = res.body.newRecordId;
    expect(res.status).toEqual(200);
    expect(res.body.error).toBeUndefined();
    //____________________________________

    const getRes = await agent
      .set('Cookie', authCookie)
      .post('/adminapi/v1/get_resource_data')
      .send({
        filters: [{field: "id", operator: "eq", value: createdRecordId}],
        limit: 1,
        offset: 0,
        resourceId: 'cars_sl',
        sort: [],
        source: "show",
      })
    expect(getRes.status).toEqual(200);
    expect(getRes.body.data[0]).toMatchObject({
      id: createdRecordId,
      model: "Abobus amogus",
      price: 1234,
      engine_type: "gasoline",
      engine_power: 1234,
      production_year: 2000,
      description: "1234",
      listed: true,
      mileage: 1234,
      color: "Blue",
      body_type: "sedan",
    });
  });

  it('returns list data for boolean filters without mutating the count path input', async () => {
    const res = await agent
      .set('Cookie', authCookie)
      .post('/adminapi/v1/get_resource_data')
      .send({
        resourceId: 'cars_sl',
        source: 'list',
        limit: 1,
        offset: 0,
        sort: [{ field: 'price', direction: 'desc' }],
        filters: [
          { field: 'id', operator: 'eq', value: createdRecordId },
          { field: 'listed', operator: 'eq', value: true },
        ],
      });

    expect(res.status).toEqual(200);
    expect(res.body.error).toBeUndefined();
    expect(res.body.total).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0]).toMatchObject({
      id: createdRecordId,
      listed: true,
    });
  });

  it('keeps computed helper fields when columns are not requested', async () => {
    const res = await agent
      .set('Cookie', authCookie)
      .post('/adminapi/v1/get_resource_data')
      .send({
        resourceId: 'cars_sl',
        source: 'list',
        limit: 1,
        offset: 0,
        sort: [],
        filters: [{ field: 'id', operator: 'eq', value: createdRecordId }],
      });

    expect(res.status).toEqual(200);
    expect(res.body.error).toBeUndefined();
    expect(res.body.data[0]._label).toBe('🚘 Abobus amogus 🚗');
  });

  it('returns exactly requested columns and omits computed helper fields', async () => {
    const res = await agent
      .set('Cookie', authCookie)
      .post('/adminapi/v1/get_resource_data')
      .send({
        resourceId: 'cars_sl',
        source: 'list',
        limit: 1,
        offset: 0,
        sort: [],
        filters: [{ field: 'id', operator: 'eq', value: createdRecordId }],
        columns: ['model', 'price'],
      });

    expect(res.status).toEqual(200);
    expect(res.body.error).toBeUndefined();
    expect(res.body.data[0]).toEqual({
      model: 'Abobus amogus',
      price: 1234,
    });
    expect(res.body.data[0]._label).toBeUndefined();
    expect(res.body.data[0]._clickUrl).toBeUndefined();
  });

  it('returns an error for unknown requested columns', async () => {
    const res = await agent
      .set('Cookie', authCookie)
      .post('/adminapi/v1/get_resource_data')
      .send({
        resourceId: 'cars_sl',
        source: 'list',
        limit: 1,
        offset: 0,
        sort: [],
        filters: [],
        columns: ['missing_column'],
      });

    expect(res.status).toEqual(200);
    expect(res.body.error).toBe('Column missing_column not found in resource cars_sl');
  });

  it('supports selecting only a virtual column without leaking internal fallback columns', async () => {
    const res = await agent
      .set('Cookie', authCookie)
      .post('/adminapi/v1/get_resource_data')
      .send({
        resourceId: 'adminuser',
        source: 'list',
        limit: 1,
        offset: 0,
        sort: [],
        filters: [{ field: 'email', operator: 'eq', value: 'adminforth' }],
        columns: ['password'],
      });

    expect(res.status).toEqual(200);
    expect(res.body.error).toBeUndefined();
    expect(res.body.data[0]).toEqual({});
  });

  it('projects requested foreign columns after reference post-processing', async () => {
    const adminUserRes = await agent
      .set('Cookie', authCookie)
      .post('/adminapi/v1/get_resource_data')
      .send({
        resourceId: 'adminuser',
        source: 'list',
        limit: 1,
        offset: 0,
        sort: [],
        filters: [{ field: 'email', operator: 'eq', value: 'adminforth' }],
        columns: ['id'],
      });

    expect(adminUserRes.status).toEqual(200);
    expect(adminUserRes.body.error).toBeUndefined();
    const adminUserId = adminUserRes.body.data[0].id;

    const updateRes = await agent
      .set('Cookie', authCookie)
      .post('/adminapi/v1/update_record')
      .send({
        resourceId: 'cars_sl',
        recordId: createdRecordId,
        meta: {},
        record: {
          seller_id: adminUserId,
        },
      });

    expect(updateRes.status).toEqual(200);
    expect(updateRes.body.error).toBeUndefined();

    const res = await agent
      .set('Cookie', authCookie)
      .post('/adminapi/v1/get_resource_data')
      .send({
        resourceId: 'cars_sl',
        source: 'list',
        limit: 1,
        offset: 0,
        sort: [],
        filters: [{ field: 'id', operator: 'eq', value: createdRecordId }],
        columns: ['seller_id'],
      });

    expect(res.status).toEqual(200);
    expect(res.body.error).toBeUndefined();
    expect(res.body.data[0]).toEqual({
      seller_id: {
        label: '👤 adminforth',
        pk: adminUserId,
      },
    });
  });

  it('projects polymorphic foreign columns without leaking polymorphic discriminator columns', async () => {
    const createRes = await agent
      .set('Cookie', authCookie)
      .post('/adminapi/v1/create_record')
      .send({
        resourceId: 'polymorphic_car_refs',
        record: {
          record_id: createdRecordId,
          image_path: 'test-image.png',
        },
        requiredColumnsToSkip: [],
        meta: {},
      });

    expect(createRes.status).toEqual(200);
    expect(createRes.body.error).toBeUndefined();

    const res = await agent
      .set('Cookie', authCookie)
      .post('/adminapi/v1/get_resource_data')
      .send({
        resourceId: 'polymorphic_car_refs',
        source: 'list',
        limit: 1,
        offset: 0,
        sort: [],
        filters: [{ field: 'id', operator: 'eq', value: createRes.body.newRecordId }],
        columns: ['record_id'],
      });

    expect(res.status).toEqual(200);
    expect(res.body.error).toBeUndefined();
    expect(res.body.data[0]).toEqual({
      record_id: {
        label: '🚘 Abobus amogus 🚗',
        pk: createdRecordId,
      },
    });
    expect(res.body.data[0].resource_id).toBeUndefined();
  });

  describe('POST /get_resource', () => {
    beforeAll(async () => {
      const res = await agent
        .post('/adminapi/v1/login')
        .send({
          username: 'adminforth',
          password: 'adminforth',
        });
      expect(res.status).toEqual(200);
      authCookie = res.headers['set-cookie']?.[0]?.split(';')[0];
      expect(authCookie).toContain('adminforth_');
    });

    it('does not expose backend-only resource metadata in frontend resource payload', async () => {
      const res = await agent
        .set('Cookie', authCookie)
        .post('/adminapi/v1/get_resource')
        .send({
          resourceId: 'cars_sl',
        });

      expect(res.status).toEqual(200);
      expect(res.body.error).toBeUndefined();
      expect(res.body.resource.resourceId).toBe('cars_sl');
      expect(res.body.resource.table).toBeUndefined();
      expect(res.body.resource.dataSource).toBeUndefined();
      expect(res.body.resource.dataSourceColumns).toBeUndefined();
    });
  });

  it('should throw error, that resource is not found', async () => {
    const res = await agent      .set('Cookie', authCookie)
      .post('/adminapi/v1/get_resource_data')
      .send({
        resourceId: 'non_existent_resource',
        filters: [],
        limit: 1,
        offset: 0,
        sort: [],
        source: "show",
      });
    expect(res.status).toEqual(200);
    expect(res.body.error).toBe("Resource non_existent_resource not found");
  });

  it('should throw error, that action is not allowed', async () => {
    const res = await agent      .set('Cookie', authCookie)
      .post('/adminapi/v1/get_resource_data')
      .send({
        resourceId: 'cars_sl_no_show',
        filters: [{field: "id", operator: "eq", value: createdRecordId_noRead}],
        limit: 1,
        offset: 0,
        sort: [],
        source: "show",
      });
    expect(res.status).toEqual(200);
    expect(res.body.error).toBe("Action is not allowed");
  });

  it('should throw error, that action is not allowed by hook', async () => {
    const res = await agent      .set('Cookie', authCookie)
      .post('/adminapi/v1/get_resource_data')
      .send({
        resourceId: 'cars_sl_no_show_by_hook',
        filters: [{field: "id", operator: "eq", value: createdRecordId_noRead_by_hook}],
        limit: 1,
        offset: 0,
        sort: [],
        source: "show",
      });
    expect(res.status).toEqual(200);
    expect(res.body.error).toBe("Operation aborted by hook");
  });

});



describe('POST /delete_record', () => {
  const requestBody: any ={
    "resourceId": "cars_sl",
    "record": {
        "model": "Abobus amogus",
        "price": "1234",
        "engine_type": "gasoline",
        "engine_power": 1234,
        "production_year": 2000,
        "description": "1234",
        "listed": true,
        "mileage": 1234,
        "color": "Blue",
        "body_type": "sedan"
    },
    "requiredColumnsToSkip": [],
    "meta": {}
  };

  let createdRecordId: string;
  let createdRecordId_noDelete: string;
  let createdRecordId_noDelete_by_hook: string;
  it('create and read ', async () => {
    const res = await agent
      .set('Cookie', authCookie)
      .post('/adminapi/v1/create_record')
      .send({
        ...requestBody,
          resourceId: 'cars_sl',
      });
    createdRecordId = res.body.newRecordId;
    expect(res.status).toEqual(200);
    expect(res.body.error).toBeUndefined();
    //record to check allowed actions
    await agent
      .set('Cookie', authCookie)
      .post('/adminapi/v1/create_record')
      .send({
        ...requestBody,
          resourceId: 'cars_sl_no_delete',
      });
    createdRecordId_noDelete = res.body.newRecordId;
    expect(res.status).toEqual(200);
    expect(res.body.error).toBeUndefined();
    //____________________________________

    //record to hook block
    await agent
      .set('Cookie', authCookie)
      .post('/adminapi/v1/create_record')
      .send({
        ...requestBody,
          resourceId: 'cars_sl_no_delete_by_hook',
      });
    createdRecordId_noDelete_by_hook = res.body.newRecordId;
    expect(res.status).toEqual(200);
    expect(res.body.error).toBeUndefined();
    //____________________________________

    const getRes = await agent
      .set('Cookie', authCookie)
      .post('/adminapi/v1/get_resource_data')
      .send({
        filters: [{field: "id", operator: "eq", value: createdRecordId}],
        limit: 1,
        offset: 0,
        resourceId: 'cars_sl',
        sort: [],
        source: "show",
      })
    expect(getRes.status).toEqual(200);
    expect(getRes.body.data[0]).toMatchObject({
      id: createdRecordId,
      model: "Abobus amogus",
      price: 1234,
      engine_type: "gasoline",
      engine_power: 1234,
      production_year: 2000,
      description: "1234",
      listed: true,
      mileage: 1234,
      color: "Blue",
      body_type: "sedan",
    });
  });

  it('should throw error, that resource is not found', async () => {
    const res = await agent      .set('Cookie', authCookie)
      .post('/adminapi/v1/delete_record')
      .send({
        resourceId: 'non_existent_resource',
        primaryKey: 'non_existent_id',
      });
    expect(res.status).toEqual(200);
    expect(res.body.error).toBe("Resource 'non_existent_resource' not found");
  });

  it('should throw error, that record with such id is not found', async () => {
    const res = await agent      .set('Cookie', authCookie)
      .post('/adminapi/v1/delete_record')
      .send({
        resourceId: 'cars_sl',
        primaryKey: 'non_existent_id',
      });
    expect(res.status).toEqual(200);
    expect(res.body.error).toBe("Record with non_existent_id not found");
  });

  it('should throw error, that delete action is not allowed', async () => {
    const res = await agent      .set('Cookie', authCookie)
      .post('/adminapi/v1/delete_record')
      .send({
        resourceId: 'cars_sl_no_delete',
        primaryKey: createdRecordId_noDelete,
      });
    expect(res.status).toEqual(200);
    expect(res.body.error).toBe("Action is not allowed");
  });

  it('should throw error, that delete action is not allowed by hook', async () => {
    const res = await agent      .set('Cookie', authCookie)
      .post('/adminapi/v1/delete_record')
      .send({
        resourceId: 'cars_sl_no_delete_by_hook',
        primaryKey: createdRecordId_noDelete_by_hook,
      });
    expect(res.status).toEqual(200);
    expect(res.body.error).toBe("Operation aborted by hook");
  });

});