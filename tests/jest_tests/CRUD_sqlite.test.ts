import request from 'supertest';

const agent = request.agent('localhost:3333');
let authCookie: string;

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
    authCookie = res.headers['set-cookie']?.[0];
    expect(authCookie).toContain('adminforth_');
  });

  it('should block unauthorized access after login', async () => {
    const res = await agent
      .post('/adminapi/v1/create_record');
    expect(res.status).toEqual(401);
  });

  it('should throw error, that resource is not found', async () => {
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

  it('should throw error, that resource is not found', async () => {
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

  it('should throw error, that column is required', async () => {
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
  it('skip required column (NEEDS TO BE FIXED)', async () => {
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

  it('dont create record with existing id', async () => {
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

  it('dont allow to set backend only field', async () => {
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

  it('dont allow to set field, that is hidden from create view', async () => {
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

  it('throw an error that value can`t be less than minValue', async () => {
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


  it('throw an error that value can`t be greater than maxValue', async () => {
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

  it('dont allow to create record by hook', async () => {
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
    authCookie = res.headers['set-cookie']?.[0];
    expect(authCookie).toContain('adminforth_');
  });

  let createdRecordId: string;
  let createdRecordId_noEdit: string;
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
    createdRecordId_noEdit = res.body.newRecordId;
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

  it('should throw error that value can`t be less than minValue', async () => {
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

  it('should throw error that value can`t be greater than maxValue', async () => {
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
        recordId: createdRecordId_noEdit,
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