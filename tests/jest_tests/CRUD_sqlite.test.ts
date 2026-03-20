import request from 'supertest';

const agent = request.agent('localhost:3333');
let authCookie: string;

describe('POST /create_record', () => {
  const requestBody: any ={
    "resourceId": "cars_sl",
    "record": {
        "photos": [],
        "model": "Abobus",
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



});