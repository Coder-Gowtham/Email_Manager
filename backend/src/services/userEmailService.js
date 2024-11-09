const { ENTERING_TO, SERVICE_METHOD, STATUS_CODE } = require('../constants/constants');
const client = require('../utils/elasticsearchClient');

const storeNewEmails = async (userMailBoxName, emails, userId) => {
    console.log(`${ENTERING_TO} ${SERVICE_METHOD} | storeNewEmails || ${JSON.stringify(userMailBoxName)}`);

    const createUserEmailIndex = async (userMailBoxName) => {
        try {
            const indexExists = await client.indices.exists({ index: userMailBoxName });
            if (!indexExists) {
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
            }
        } catch (error) {
            console.error(`Error in createUserEmailIndex || ${error.message}`);
            throw error;
        }
    };

    const storeEmails = async (userMailBoxName, emails) => {
        try {
            // Retrieve existing message_ids
            const messageIds = emails.map(email => email.message_id);
            const existingEmails = await client.search({
                index: userMailBoxName,
                body: {
                    query: {
                        terms: { message_id: messageIds }
                    }
                },
                _source: ['message_id']
            });

            // Get existing message_ids for updates
            const existingIds = new Set(existingEmails.hits.hits.map(hit => hit._source.message_id));
            
            const operations = emails.flatMap(email => {
                const action = existingIds.has(email.message_id) ? 'update' : 'index';
                if (action === 'update') {
                    return [
                        { update: { _index: userMailBoxName, _id: email.message_id } },
                        { doc: {
                            user_id: userId,
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
                        } }
                    ];
                } else {
                    return [
                        { index: { _index: userMailBoxName, _id: email.message_id } },
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
                    ];
                }
            });

            const bulkResponse = await client.bulk({ refresh: true, body: operations });
            if (bulkResponse.errors) {
                const errors = bulkResponse.items.filter(item => item.update?.error || item.index?.error).map(item => ({
                    id: item.update?._id || item.index?._id,
                    error: item.update?.error || item.index?.error
                }));
                console.error('Bulk indexing encountered errors:', errors);
                return {
                    status: STATUS_CODE.PARTIAL_SUCCESS,
                    message: 'Bulk indexing encountered errors.',
                    errors: errors
                };
            }

            console.log('All emails processed successfully.');
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
        await createUserEmailIndex(userMailBoxName);
        return await storeEmails(userMailBoxName, emails);
    } catch (error) {
        console.error(`Error in storeNewEmails || ${error.message}`);
        return {
            status: STATUS_CODE.DATABASE_ERROR,
            message: `Error in storeNewEmails for ${userMailBoxName}.`,
            error: error.message || error
        };
    }
};

module.exports = {
    storeNewEmails,
};
