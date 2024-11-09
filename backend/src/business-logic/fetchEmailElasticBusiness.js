const { STATUS_CODE } = require('../constants/constants');
const elasticsearchClient = require('../utils/elasticsearchClient');

const fetchEmailElasticBusiness = async (folder = 'ALL', indexName) => {
  try {
    console.log(`Checking if index ${indexName} exists...`);
    const indexExists = await elasticsearchClient.indices.exists({ index: indexName });

    if (!indexExists) {
      console.error(`Index ${indexName} not found`);
      throw new Error('Index not found');
    }

    console.log(`Index ${indexName} found. Proceeding with query creation.`);

    const query = {
      bool: {
        must: [],
      },
    };

    if (folder === 'Others') {
      console.log(`Folder is 'Others', excluding standard folders.`);
      const excludedFolders = ['Inbox', 'Sent', 'Drafts', 'Outbox', 'Junk', 'Deleted', 'Archive', 'Notes'];
      query.bool.must.push({
        bool: {
          must_not: [
            { terms: { folderName: excludedFolders } }
          ]
        }
      });
    } else if (folder !== 'ALL') {
      console.log(`Folder is '${folder}', adding folder filter.`);
      query.bool.must.push({ match: { folderName: folder } });
    } else {
      console.log(`Folder is 'ALL', no folder filter applied.`);
    }

    const body = {
      query: query,
      size: 10000, // Retrieve up to 10,000 emails
      sort: [
        { date: { order: 'desc', unmapped_type: 'date' } }
      ],
    };

    console.log('Elasticsearch query body:', JSON.stringify(body, null, 2));

    const response = await elasticsearchClient.search({
      index: indexName,
      body,
    });

    const hits = response.hits?.hits || [];
    console.log(`Found ${hits.length} emails in the index.`);

    if (hits.length > 0) {
      const emails = hits.map(hit => hit._source);
      const totalHits = response.hits.total.value;

      console.log(`Returning ${emails.length} emails, total hits: ${totalHits}`);
      return {
        emails,
        totalHits,
      };
    } else {
      console.log('No emails found in the folder');
      return {
        status: 'SUCCESS',
        message: 'No emails in the folder',
        error: ''
      };
    }
  } catch (error) {
    console.error('Error fetching emails from Elasticsearch:', error);

    const errResp = {
      status: 'ERROR',
      message: error?.message || 'FAILED TO FETCH FROM DATABASE',
      error: JSON.stringify(error)
    };

    throw new Error(JSON.stringify(errResp));
  }
};


module.exports = { fetchEmailElasticBusiness };
