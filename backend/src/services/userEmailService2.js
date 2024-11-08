const { ENTERING_TO, SERVICE_METHOD, STATUS_CODE } = require('../constants/constants');
const client = require('../elasticsearchClient');

const createUserEmailIndex = async (indexName) => {
    console.log(`${ENTERING_TO} ${SERVICE_METHOD} | createIndices || ${JSON.stringify(indexName)}`);
    const response = {};
    try {
        const indexExists = await client.indices.exists({ index: indexName });
        console.log(`createUserEmailIndex | is indexExists || ${indexName} => ${indexExists}`);
        if (indexExists) {
            console.log(`Index already exists: ${indexName}`);
            response.message = `Index already exists: ${indexName}`
        } else {
            let body;
            body = {
                "mappings": {
                    "properties": {
                        "message_id": { "type": "keyword" },
                        "subject": { "type": "text" },
                        "receivedDateTime": { "type": "date", "format": "strict_date_optional_time||epoch_millis" },
                        "sentDateTime": { "type": "date", "format": "strict_date_optional_time||epoch_millis" },
                        "sender": {
                            "properties": {
                                "name": { "type": "text" },
                                "address": { "type": "keyword" }
                            }
                        },
                        "from": {
                            "properties": {
                                "name": { "type": "text" },
                                "address": { "type": "keyword" }
                            }
                        },
                        "toRecipients": { "type": "keyword" },
                        "webLink": { "type": "text", "index": false },
                        "isRead": { "type": "boolean" },
                        "isDraft": { "type": "boolean" },
                        "folderName": { "type": "keyword" },
                        "flag": { "type": "keyword" },
                        "preview": { "type": "text", "analyzer": "standard" },
                        "body": { "type": "text", "analyzer": "standard" }
                    }
                }
            }

            await client.indices.create({
                index: indexName,
                body,
            });
            console.log(`Index created: ${indexName}`);
            response.message = `Index created: ${indexName} `
        }
        return { status: STATUS_CODE.SUCCESS, message: `Index ${indexName} processed successfully` };

    } catch (error) {
        console.error(`Error in createUserEmailIndex || ${error.message}`);
        const dbErrorResponse = {
            status: error?.status || 510,
            message: "Error executing to database.",
            error: error
        };
        throw dbErrorResponse;

    }
};

const storeEmails = async (indexName, emails) => {
    console.log(`${ENTERING_TO} ${SERVICE_METHOD} | storeEmails || ${JSON.stringify(indexName)}`);

    try {
        const BATCH_SIZE = 20;
        for (let i = 0; i < emails.length; i += BATCH_SIZE) {
            const batch = emails.slice(i, i + BATCH_SIZE).flatMap(email => [
                { index: { _index: indexName } },
                {
                    message_id: email.id,
                    subject: email.subject,
                    body: email.body,
                    preview: email.preview,
                    sender: email.sender,
                    from: email.from,
                    toRecipients: email.toRecipients,
                    webLink: email.webLink,
                    isRead: email.isRead,
                    isDraft: email.isDraft,
                    folderName: email.folderName,
                    flag: email.flag,
                }
            ]);

            const bulkResponse = await client.bulk({ refresh: true, body: batch });
            console.log('bulkResponse', JSON.stringify(bulkResponse, null, 2)); // Log full response for debugging

            if (bulkResponse.errors) {
                console.error('Bulk indexing encountered errors:');
                // Log errors per item to identify issues
                bulkResponse.items.forEach(item => {
                    if (item.index && item.index.error) {
                        console.error(`Error indexing email ID ${item.index._id}:`, item.index.error);
                    }
                });
            } else {
                console.log(`Batch indexed successfully, batch size: ${batch.length / 2}`);
            }
        }
    } catch (error) {
        console.error('Error storing emails:', error.message || error);
        throw new Error(`Error storing emails: ${error.message || error}`);
    }
};




module.exports = {
    createUserEmailIndex,
    storeEmails
};

