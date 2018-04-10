/**
 * 
 */
var twitterConnector = mstr.createConnector();

twitterConnector.fetchTable = function(table, data, doneCallback){
	var mstrObj = JSON.parse(data);
	
	var selectedAttributes = mstrObj.connectionData.selectedAttributes;
	var selectedType = mstrObj.connectionData.selectedType;
	
	var fields = encodeURI(selectedAttributes.join(','));
	var apiCall = 'http://sfdc-mstr-connector.cloudhub.io/api/sobjects/' + selectedType + '/data?querylist=' + fields;


	var cols = [];

	for (var i = 0; i < selectedAttributes.length; i++) {
		cols.push({
			name: selectedAttributes[i],
			dataType: mstr.dataTypeEnum.string
		});
	}
	table.tableSchema.column = cols;

	$.getJSON(apiCall, function (resp) {

		table.appendRawData(JSON.stringify(resp));
		doneCallback(table);
	});
};

mstr.registerConnector(twitterConnector);

$(document).ready(function(){
	$("#submitButton").click(function(){
		

		var dataObj = {

			selectedAttributes: window.selectedAttributes,
			selectedType: window.selectedType

		};

		mstr.connectionData = dataObj;

		// This will be the data source name in mstr

		mstr.connectionName = "SFDC Mule CONNECTOR";

		mstr.fileType = 'JSON';

		var params = {};

		mstr.connectionData = mstr.connectionData;

		mstr.authenticationInfo = "";

		mstr.authType = mstr.authTypeEnum.anonymous;

		mstr.tableList = [];

		mstr.tableList.push({ tableName: window.selectedType });


		window.mstr.submit();
	});
});