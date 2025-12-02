/**
 * Filter type options for asset search
 */
export const filterTypeOptions = [
	{
		name: 'Full Text',
		value: 'ASSET_FULLTEXT',
		description: 'Search across all text fields (most common)',
	},
	{
		name: 'Asset Name',
		value: 'ASSET_NAME',
		description: 'Filter by asset name',
	},
	{
		name: 'Asset ID',
		value: 'ASSET_ID',
		description: 'Filter by specific asset ID',
	},
	{
		name: 'Asset ID Range',
		value: 'ASSET_ID_RANGE',
		description: 'Filter by asset ID range',
	},
	{
		name: 'File Name',
		value: 'ASSET_FILE_NAME',
		description: 'Filter by current version filename',
	},
	{
		name: 'File Extension',
		value: 'ASSET_FILE_EXTENSION',
		description: 'Filter by file extension',
	},
	{
		name: 'File Extension Empty',
		value: 'ASSET_FILE_EXTENSION_EMPTY',
		description: 'Find assets with no file extension',
	},
	{
		name: 'File Category',
		value: 'ASSET_FILE_CATEGORY',
		description: 'Filter by file category',
	},
	{
		name: 'Checksum',
		value: 'ASSET_CHECKSUM',
		description: 'Filter by file checksum',
	},
	{
		name: 'Asset Type ID',
		value: 'ASSET_TYPE_ID',
		description: 'Filter by asset type',
	},
	{
		name: 'Parent Collection ID',
		value: 'ASSET_PARENT_ID',
		description: 'Filter by parent collection',
	},
	{
		name: 'Collection Type ID',
		value: 'ASSET_COLLECTION_TYPE_ID',
		description: 'Filter by collection type',
	},
	{
		name: 'Creation Date (Exact)',
		value: 'ASSET_CREATION_DATE_EQUALITY',
		description: 'Filter by exact creation date',
	},
	{
		name: 'Creation Date Range',
		value: 'ASSET_CREATION_DATE_RANGE',
		description: 'Filter by creation date range',
	},
	{
		name: 'Modification Date (Exact)',
		value: 'ASSET_MODIFICATION_DATE_EQUALITY',
		description: 'Filter by exact modification date',
	},
	{
		name: 'Modification Date Range',
		value: 'ASSET_MODIFICATION_DATE_RANGE',
		description: 'Filter by modification date range',
	},
	{
		name: 'Version Creation Date Range',
		value: 'ASSET_VERSIONED_DATE_RANGE',
		description: 'Filter by current version creation date range',
	},
	{
		name: 'Version Creation Date (Exact)',
		value: 'ASSET_VERSIONED_DATE_EQUALITY',
		description: 'Filter by exact current version creation date',
	},
	{
		name: 'Availability Date Range',
		value: 'ASSET_AVAILABILITY_DATE_RANGE',
		description: 'Filter by availability date range',
	},
	{
		name: 'Expiration Date Range',
		value: 'ASSET_EXPIRATION_DATE_RANGE',
		description: 'Filter by expiration date range',
	},
	{
		name: 'Created By User ID',
		value: 'ASSET_CREATION_USER_ID',
		description: 'Filter by creator user ID',
	},
	{
		name: 'Modified By User ID',
		value: 'ASSET_MODIFICATION_USER_ID',
		description: 'Filter by modifier user ID',
	},
	{
		name: 'Version Created By User ID',
		value: 'ASSET_VERSIONED_USER_ID',
		description: 'Filter by version creator user ID',
	},
	{
		name: 'Availability',
		value: 'ASSET_AVAILABILITY',
		description: 'Filter by asset availability status',
	},
	{
		name: 'Content',
		value: 'ASSET_CONTENT',
		description: 'Filter by asset content',
	},
	{
		name: 'Text Information Field',
		value: 'ASSET_TEXT_INFORMATION_FIELD',
		description: 'Filter by text information field value',
	},
	{
		name: 'Text Area Information Field',
		value: 'ASSET_TEXT_AREA_INFORMATION_FIELD',
		description: 'Filter by text area information field value',
	},
	{
		name: 'Localized Text Information Field',
		value: 'ASSET_LOCALIZED_TEXT_INFORMATION_FIELD',
		description: 'Filter by localized text information field',
	},
	{
		name: 'Localized Text Area Information Field',
		value: 'ASSET_LOCALIZED_TEXT_AREA_INFORMATION_FIELD',
		description: 'Filter by localized text area information field',
	},
	{
		name: 'Date Information Field (Exact)',
		value: 'ASSET_DATE_INFORMATION_FIELD_EQUALITY',
		description: 'Filter by exact date information field value',
	},
	{
		name: 'Date Information Field Range',
		value: 'ASSET_DATE_INFORMATION_FIELD_RANGE',
		description: 'Filter by date information field range',
	},
	{
		name: 'Number Information Field (Exact)',
		value: 'ASSET_NUMBER_INFORMATION_FIELD_EQUALITY',
		description: 'Filter by exact number information field value',
	},
	{
		name: 'Number Information Field Range',
		value: 'ASSET_NUMBER_INFORMATION_FIELD_RANGE',
		description: 'Filter by number information field range',
	},
	{
		name: 'Double Information Field (Exact)',
		value: 'ASSET_DOUBLE_INFORMATION_FIELD_EQUALITY',
		description: 'Filter by exact double information field value',
	},
	{
		name: 'Double Information Field Range',
		value: 'ASSET_DOUBLE_INFORMATION_FIELD_RANGE',
		description: 'Filter by double information field range',
	},
	{
		name: 'Boolean Information Field',
		value: 'ASSET_BOOLEAN_INFORMATION_FIELD',
		description: 'Filter by boolean information field value',
	},
	{
		name: 'Dropdown Information Field',
		value: 'ASSET_DROPDOWN_INFORMATION_FIELD_EQUALITY',
		description: 'Filter by dropdown information field value',
	},
	{
		name: 'Collection Reference Information Field',
		value: 'ASSET_COLLECTION_REFERENCE_INFORMATION_FIELD_EQUALITY',
		description: 'Filter by collection reference information field',
	},
	{
		name: 'Collection Reference Information Field Names',
		value: 'ASSET_COLLECTION_REFERENCE_INFORMATION_FIELD_NAMES',
		description: 'Filter by collection reference field names',
	},
	{
		name: 'Tag Reference Information Field',
		value: 'ASSET_TAG_REFERENCE_INFORMATION_FIELD_EQUALITY',
		description: 'Filter by tag reference information field',
	},
	{
		name: 'Tag Reference Information Field Names',
		value: 'ASSET_TAG_REFERENCE_INFORMATION_FIELD_NAMES',
		description: 'Filter by tag reference field names',
	},
	{
		name: 'Information Field Empty',
		value: 'ASSET_INFORMATION_FIELD_EMPTY',
		description: 'Find assets with empty information field',
	},
	{
		name: 'Text File Property',
		value: 'ASSET_TEXT_FILE_PROPERTY',
		description: 'Filter by text file property',
	},
	{
		name: 'Number File Property (Exact)',
		value: 'ASSET_NUMBER_FILE_PROPERTY_EQUALITY',
		description: 'Filter by exact number file property value',
	},
	{
		name: 'Number File Property Range',
		value: 'ASSET_NUMBER_FILE_PROPERTY_RANGE',
		description: 'Filter by number file property range',
	},
	{
		name: 'Double File Property (Exact)',
		value: 'ASSET_DOUBLE_FILE_PROPERTY_EQUALITY',
		description: 'Filter by exact double file property value',
	},
	{
		name: 'Double File Property Range',
		value: 'ASSET_DOUBLE_FILE_PROPERTY_RANGE',
		description: 'Filter by double file property range',
	},
	{
		name: 'Date File Property (Exact)',
		value: 'ASSET_DATE_FILE_PROPERTY_EQUALITY',
		description: 'Filter by exact date file property value',
	},
	{
		name: 'Date File Property Range',
		value: 'ASSET_DATE_FILE_PROPERTY_RANGE',
		description: 'Filter by date file property range',
	},
	{
		name: 'Boolean File Property',
		value: 'ASSET_BOOLEAN_FILE_PROPERTY',
		description: 'Filter by boolean file property',
	},
	{
		name: 'Logical (AND/OR/NOT)',
		value: 'ASSET_LOGICAL',
		description: 'Combine multiple filters with logical operators',
	},
	{
		name: 'Negation',
		value: 'ASSET_NEGATION',
		description: 'Negate another filter',
	},
];

