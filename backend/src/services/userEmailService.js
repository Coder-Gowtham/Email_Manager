const { ENTERING_TO, SERVICE_METHOD, STATUS_CODE } = require('../constants/constants');
const client = require('../elasticsearchClient');

const storeNewEmails = async (userMailBoxName, emails, userId) => {
    console.log(`${ENTERING_TO} ${SERVICE_METHOD} | storeNewEmails || ${JSON.stringify(userMailBoxName)}`);


    const createUserEmailIndex = async (userMailBoxName) => {
        console.log(`${ENTERING_TO} ${SERVICE_METHOD} | createUserEmailIndex || ${JSON.stringify(userMailBoxName)}`);
        try {
            const indexExists = await client.indices.exists({ index: userMailBoxName });
            console.log(`createUserEmailIndex | is indexExists || ${userMailBoxName} => ${indexExists}`);

            if (indexExists) {
                console.log(`Index already exists: ${userMailBoxName}`);
                return {
                    status: STATUS_CODE.SUCCESS,
                    message: `Index already exists: ${userMailBoxName}`
                };
            } else {
                const body = {
                    "mappings": {
                        "properties": {
                            "user_id": { "type": "keyword" },
                            "message_id": { "type": "keyword" },
                            "subject": { "type": "text" },
                            "isSeen": { "type": "boolean" },
                            "folderName": { "type": "keyword" },
                            "from": {
                                "properties": {
                                    "name": { "type": "text" },
                                    "address": { "type": "keyword" }
                                }
                            },
                            "to": {
                                "properties": {
                                    "name": { "type": "text" },
                                    "address": { "type": "keyword" }
                                }
                            },
                            "uid": { "type": "keyword" },
                            "date": { "type": "date" },
                            "flag": { "type": "keyword" },
                            "bodystructure": { "type": "text" },
                            "email_body": { "type": "text", "analyzer": "standard" }
                        }
                    }
                };

                await client.indices.create({
                    index: userMailBoxName,
                    body,
                });
                console.log(`Index created: ${userMailBoxName}`);
                return {
                    status: STATUS_CODE.SUCCESS,
                    message: `Index created: ${userMailBoxName}`
                };
            }
        } catch (error) {
            console.error(`Error in createUserEmailIndex || ${error.message}`);
            return {
                status: STATUS_CODE.DATABASE_ERROR,
                message: `Error creating index ${userMailBoxName}.`,
                error: error.message
            };
        }
    };

    const storeEmails = async (userMailBoxName, emails) => {
        console.log(`${ENTERING_TO} ${SERVICE_METHOD} | storeEmails || ${JSON.stringify(userMailBoxName)}`);
        try {
            const BATCH_SIZE = 20;
            for (let i = 0; i < emails.length; i += BATCH_SIZE) {
                const batch = emails.slice(i, i + BATCH_SIZE).flatMap(email => [
                    { index: { _index: userMailBoxName } },
                    {
                        user_id: userId,
                        message_id: email.message_id,
                        subject: email.subject,
                        isSeen: email.isSeen,
                        email_body: email.email_body,
                        from: email.from,
                        to: email.to,
                        uid: email.uid,
                        folderName: email.folderName,
                        flag: email.flag,
                        bodystructure: email.bodystructure,
                        date: email.date
                    }
                ]);

                const bulkResponse = await client.bulk({ refresh: true, body: batch });
                console.log('bulkResponse', JSON.stringify(bulkResponse ? true : false));

                if (bulkResponse.errors) {
                    const errors = bulkResponse.items.filter(item => item.index && item.index.error).map(item => ({
                        id: item.index._id,
                        error: item.index.error
                    }));
                    console.error('Bulk indexing encountered errors:', errors);
                    return {
                        status: STATUS_CODE.PARTIAL_SUCCESS,
                        message: 'Bulk indexing encountered errors.',
                        errors: errors
                    };
                } else {
                    console.log(`Batch indexed successfully, batch size: ${batch.length / 2}`);
                }
            }
            return {
                status: STATUS_CODE.SUCCESS,
                message: 'All emails indexed successfully.'
            };
        } catch (error) {
            console.error('Error storing emails:', error.message || error);
            return {
                status: STATUS_CODE.DATABASE_ERROR,
                message: `Error storing emails in index ${userMailBoxName}.`,
                error: error.message || error
            };
        }
    };

    try {
        const indexResponse = await createUserEmailIndex(userMailBoxName);
        if (indexResponse.status === STATUS_CODE.SUCCESS) {
            const storeResponse = await storeEmails(userMailBoxName, emails);
            return storeResponse;
        } else {
            console.error(`Failed to create or confirm existence of index ${userMailBoxName}`);
            return indexResponse;
        }
    } catch (error) {
        console.error(`Error in storeNewEmails || ${error.message}`);
        return {
            status: STATUS_CODE.DATABASE_ERROR,
            message: `Error in storeNewEmails for ${userMailBoxName}.`,
            error: error.message || error
        };
    }
};

const lastSynced = async (userMailBoxName) => {
    console.log(`${ENTERING_TO} ${SERVICE_METHOD} | lastSynced || ${JSON.stringify(userMailBoxName)}`);
    try {
        // Check if the index exists before querying
        const indexExists = await client.indices.exists({ index: userMailBoxName });
        console.log(`lastSynced | is indexExists || ${userMailBoxName} => ${indexExists}`);

        if (!indexExists) {
            console.log(`Index does not exist: ${userMailBoxName}`);
            return '0000-11-05T17:27:00.000Z'
        }

        // Query to get the most recent `date` value
        const response = await client.search({
            index: userMailBoxName,
            size: 1, // Limit to 1 result
            sort: [{ date: { order: "desc" } }], // Sort by date in descending order
            _source: ["date"], // Only retrieve the date field
        });

        // Check if any hits were returned
        const hits = response.hits.hits;
        if (hits.length > 0) {
            const lastSyncedDate = hits[0]._source.date;
            console.log(`Most recent synced date: ${lastSyncedDate}`);
            return lastSyncedDate;
        } else {
            return '0000-11-05T17:27:00.000Z'
        }
    } catch (error) {
        console.error(`Error in lastSynced || ${error.message}`);
        return {
            status: STATUS_CODE.DATABASE_ERROR,
            message: `Error fetching last synced date for index ${userMailBoxName}.`,
            error: error.message,
        };
    }
};


module.exports = {
    storeNewEmails,
    lastSynced
};
