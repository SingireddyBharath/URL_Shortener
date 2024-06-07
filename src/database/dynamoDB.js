const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const db = new DynamoDBClient({
    region: process.env.AWS_DEFAULT_REGION,
});
const {
    GetItemCommand,
    PutItemCommand,
    DeleteItemCommand,
    ScanCommand,
    UpdateItemCommand,
    QueryCommand
} = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;
// Index key and index name mapping
const INDEX_MAP = {
    "longUrl": "longUrl-index",
}

const getAllItems = async () => {
    try {
        const params = {
            TableName: TABLE_NAME,
        };

        let Items;
        try {
            const result = await db.send(new ScanCommand(params));
            Items = result.$metadata.httpStatusCode === 200 ? result.Items : [];
        } catch (error) {
            __logger.error(`Failed to execute scan command on ${TABLE_NAME}: ${error}`);
            throw error;
        }

        __logger.info(`Successfully fetched all items from ${TABLE_NAME}`);
        const allItems = Items.map((item) => unmarshall(item))

        return allItems;
    } catch (error) {
        __logger.error(`Failed to fetch items from ${TABLE_NAME}: ${error}`);
        throw error;
    }
};

const getSingleItemById = async (keyObj) => {
    try {
        let params = {
            TableName: TABLE_NAME,
            Key: marshall(keyObj)
        };

        let response;
        try {
            response = await db.send(new GetItemCommand(params));
        } catch (error) {
            __logger.error(`Failed to execute getItem command on ${TABLE_NAME} for key ${JSON.stringify(keyObj)}: ${error}`);
            throw error;
        }

        if (!response.Item) {
            __logger.info(`No item found with ${JSON.stringify(keyObj)} in ${TABLE_NAME}`);
            return null;
        }

        const Item = unmarshall(response.Item);

        __logger.info(`Successfully fetched item with ${JSON.stringify(keyObj)} from ${TABLE_NAME}`);
        return Item;
    } catch (error) {
        __logger.error(`Failed to fetch item with id ${JSON.stringify(keyObj)} from ${TABLE_NAME}: ${error}`);
        throw error;
    }
};

const getSingleItemByGSIId = async (keyObj) => {
    try {
        let attribute = Object.entries(keyObj)[0];
        let [attributeName, attributeValue] = attribute;

        if (!INDEX_MAP[attributeName]) {
            let errorMsg = "No index found for " + attributeName;
            __logger.error(errorMsg);
            throw new Error(errorMsg);
        }

        const params = {
            TableName: TABLE_NAME,
            IndexName: INDEX_MAP[attributeName],
            KeyConditionExpression: `#${attributeName} = :${attributeName}`,
            ExpressionAttributeNames: {
                [`#${attributeName}`]: attributeName
            },
            ExpressionAttributeValues: marshall({
                [`:${attributeName}`]: attributeValue
            }),
        };

        let response;
        try {
            response = await db.send(new QueryCommand(params));
        } catch (error) {
            __logger.error(`Failed to execute query command on ${TABLE_NAME} for key ${JSON.stringify(keyObj)}: ${error}`);
            throw error;
        }

        if (!response.Items || !response.Items.length) {
            __logger.info(`No item found with ${JSON.stringify(keyObj)} in ${TABLE_NAME}`);
            return null;
        }

        const Items = response.Items.map(item => unmarshall(item));

        __logger.info(`Successfully fetched item with ${JSON.stringify(keyObj)} from ${TABLE_NAME}`);
        return Items[0] || {};
    } catch (error) {
        __logger.error(`Failed to fetch item with id ${JSON.stringify(keyObj)} from ${TABLE_NAME}: ${error}`);
        throw error;
    }
};

const insertItem = async (itemObject) => {
    try {
        const params = {
            TableName: TABLE_NAME,
            Item: marshall(itemObject),
        };

        let result;
        try {
            result = await db.send(new PutItemCommand(params));
            __logger.info(`Successfully inserted item ${JSON.stringify(itemObject)} into ${TABLE_NAME}`);
        } catch (error) {
            __logger.error(`Failed to execute put command on ${TABLE_NAME} for item ${JSON.stringify(itemObject)}: ${error}`);
            throw error;
        }

        return result;
    } catch (error) {
        __logger.error(`Failed to insert item ${JSON.stringify(itemObject)} into ${TABLE_NAME}: ${error}`);
        throw error;
    }
};


const updateItem = async (id, itemObject) => {
    try {
        if (!id || !id.shortId) throw new Error('Invalid ID');
        const objKeys = Object.keys(itemObject);

        const params = {
            TableName: TABLE_NAME,
            Key: marshall(id),
            UpdateExpression: `SET ${objKeys.map((_, index) => `#key${index} = :value${index}`).join(", ")}`,
            ExpressionAttributeNames: objKeys.reduce((acc, key, index) => ({
                ...acc,
                [`#key${index}`]: key,
            }), {}),
            ExpressionAttributeValues: marshall(objKeys.reduce((acc, key, index) => ({
                ...acc,
                [`:value${index}`]: itemObject[key],
            }), {})),
        };

        let result;
        try {
            result = await db.send(new UpdateItemCommand(params));
        } catch (error) {
            __logger.error(`Failed to send update command for item with id ${id.shortId} in ${TABLE_NAME}: ${error}`);
            throw error;
        }

        if (result.Attributes) {
            result.Attributes = unmarshall(result.Attributes);
        }

        __logger.info(`Successfully updated item with id ${id.shortId} in ${TABLE_NAME}`);
        return result;
    } catch (error) {
        __logger.error(`Failed to update item with id ${id ? id.shortId : 'UNKNOWN'} in ${TABLE_NAME}: ${error}`);
        throw error;
    }
};


const deleteSingleItemById = async (id) => {
    try {
        const params = {
            TableName: TABLE_NAME,
            Key: marshall(id)
        };

        let result;
        try {
            result = await db.send(new DeleteItemCommand(params));
            __logger.info(`Successfully deleted item ${JSON.stringify(id)} from ${TABLE_NAME}`);
        } catch (error) {
            __logger.error(`Failed to execute delete command on ${TABLE_NAME} for item ${JSON.stringify(id)}. Error: ${error}`);
            throw error;
        }

        return result;
    } catch (error) {
        __logger.error(`Failed to delete item ${JSON.stringify(id)} from ${TABLE_NAME}. Error: ${error}`);
        throw error;
    }
};


module.exports = {
    db,
    getAllItems,
    getSingleItemById,
    insertItem,
    updateItem,
    deleteSingleItemById,
    getSingleItemByGSIId
};