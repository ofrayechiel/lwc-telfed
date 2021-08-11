import { LightningElement, wire, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import getACDocuments from '@salesforce/apex/AC_Documents_Controller.getACDocuments';

import { getRecord, updateRecord } from 'lightning/uiRecordApi';
import ID_FIELD from '@salesforce/schema/Assistance_Request__c.Id';
import REQ_DOCS_FIELD from '@salesforce/schema/Assistance_Request__c.Required_Documents__c';
import NON_REQ_DOCS_FIELD from '@salesforce/schema/Assistance_Request__c.Non_Required_Documents__c';

export default class AcDocs extends LightningElement {
    @api recordId;
    docs = [];
    nonReqDocs = [];
    docNameMap = [];
    docOrderMap = [];
    draftValues = [];
    @track isModalOpen = false;

    connectedCallback()
	{
        var res = getACDocuments().then(
			result =>
			{
                result.forEach(doc => {
                    this.docNameMap[doc['Code__c']] = doc['Name__c'];
                    this.docOrderMap[doc['Code__c']] = doc['Order__c'];
                });

                this.docs.forEach(doc => {
                    doc.Name = this.docNameMap[doc.Code];
                    doc.Order = this.docOrderMap[doc.Code];
                });
                
                this.nonReqDocs.forEach(doc => {
                    doc.Name = this.docNameMap[doc.Code];
                    doc.Order = this.docOrderMap[doc.Code];
                });
                
                this.docs.sort((a, b) => a.Order - b.Order);
                // causes the table to re-render
                this.docs = [...this.docs];
			}
		).catch( error =>
		{
			alert('This is the error ::: ' + error);
		});
    }

    @wire(getRecord, { recordId: '$recordId', fields: [REQ_DOCS_FIELD, NON_REQ_DOCS_FIELD] })
    wiredAssitanceRequest({ error, data }) {
        if (data) {
            this.docs = this.unparseDocsString(data.fields.Required_Documents__c.value);
            this.nonReqDocs = this.unparseDocsString(data.fields.Non_Required_Documents__c.value);
            //alert(JSON.stringify(this.nonReqDocs));
        } else if (error) {
        }
    }

    unparseDocsString(docsString) {
        var result = [];

        if (docsString == null) {
            return result;
        }

        var doc;
        for (doc of docsString.split(',')) {
            var code = doc.split(':')[0];
            var status = (doc.split(':').length == 1) ? 'W' : doc.split(':')[1];

            result.push({
                Code: code,
                Name: this.docNameMap[code],
                Order: this.docOrderMap[code],
                Submitted: (status != 'W'),
                ApprovalStatus: (status == 'A' ? 'Approved' : (status == 'R' ? 'Rejected' : '')),
                ApprovalStatusIcon: (status == 'A' ? 'standard:approval' : (status == 'R' ? 'standard:first_non_empty' : '')), 
                isAttached: false,
            });
        }

        return result;
    }

  columns = [
    { label: 'Name', fieldName: 'Name' , hideDefaultActions: true},
    { label: 'Submitted', fieldName: 'Submitted', type: 'boolean', editable: true},
    {label: 'Status', iconName: 'utility:approval', cellAttributes:
     { iconName: { fieldName: 'ApprovalStatusIcon' }, iconLabel: { fieldName: 'ApprovalStatus'}} , hideDefaultActions: true},
    //{ label: 'Description', fieldName: 'Description'  , hideDefaultActions: true},
    //{ label: 'Attached', fieldName: 'isAttached', type: 'boolean' },
    {
        type: 'action',
        typeAttributes: { rowActions: this.getRowActions },
    },
];

    getRowActions(row, doneCallback) {
        const actions = [];
        // if (row['isAttached']) {
        //     actions.push({
        //         'label': 'View',
        //         'name': 'view'
        //     });
        // }
        // if (!row['isAttached']) {
        //     actions.push({
        //         'label': 'Attach',
        //         'name': 'attach'
        //     });
        // }
        if (row['Submitted'] && row['ApprovalStatus'] != 'Approved') {
            actions.push({
                'label': 'Approve',
                'name': 'approve',
                iconName: 'standard:approval',
            });
        }
        if (row['Submitted'] && row['ApprovalStatus'] != 'Rejected') {
            actions.push({
                'label': 'Reject',
                'name': 'reject',
                iconName: 'standard:first_non_empty'
            });
        }
        doneCallback(actions);
    }

    stringifyDocuments(docs, saveWaiting) {
        var strDocs = '';
        docs.forEach(doc => {
            var statusLetter = 'W';
            if (doc.Submitted) statusLetter = 'S';
            if (doc.ApprovalStatus == 'Approved') statusLetter = 'A';
            if (doc.ApprovalStatus == 'Rejected') statusLetter = 'R';

            if (statusLetter != 'W' || saveWaiting) {
                strDocs += doc.Code + ':' + statusLetter + ',';
            }
        });

        // remove last comma
        if (strDocs.length > 0) 
            strDocs = strDocs.substr(0, strDocs.length - 1);

        return strDocs;
    }

    handleCellChange(event) {
        event.detail.draftValues.forEach(row => {
            var doc = this.docs.find(x => (x.Code == row.Code));
            if (doc) {
                if (row['Submitted'] != undefined) {
                    doc.Submitted = row.Submitted;
                    if (!doc.Submitted) { 
                        doc.ApprovalStatus = '';
                        doc.ApprovalStatusIcon = '';
                        doc.isAttached = false;
                    }
                }
            }
        });
        this.handleSave(event);
//        alert(JSON.stringify(event));
    }

    saveToDB(successMsg) {
        var reqDocsStr = this.stringifyDocuments(this.docs, true);
        var nonReqDocsStr = this.stringifyDocuments(this.nonReqDocs, false);
        //alert(reqDocs);
        const fields = {};
        fields[ID_FIELD.fieldApiName] = this.recordId;
        fields[REQ_DOCS_FIELD.fieldApiName] = reqDocsStr;
        fields[NON_REQ_DOCS_FIELD.fieldApiName] = nonReqDocsStr;

        const recordInput = { fields };

        updateRecord(recordInput).then(() => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: successMsg,
                    variant: 'success'
                })
            );
            // Display fresh data in the form
            //return refreshApex(this.contact);
        })
        .catch(error => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error updating record',
                    message: error.body.message,
                    variant: 'error'
                })
            );
        });
        
    }

    handleSave(event) {
        this.saveToDB('Document status updated');
        //alert(JSON.stringify(this.docs));
        this.draftValues = [];
    }

    handleRowAction(event) {
        const action = event.detail.action;
        const row = event.detail.row;
        switch (action.name) {
            case 'approve':
                var doc = this.docs.find(x => (x.Code == row.Code));
                if (doc) doc.ApprovalStatus = 'Approved';
                this.saveToDB('Document Approved');
                break;
            case 'reject':
                var doc = this.docs.find(x => (x.Code == row.Code));
                if (doc) doc.ApprovalStatus = 'Rejected';
                this.saveToDB('Document Rejected');
                break;
            case 'view':
                alert('Showing Details: ' + JSON.stringify(row));
                break;
            case 'delete':
                // const rows = this.data;
                // const rowIndex = rows.indexOf(row);
                // rows.splice(rowIndex, 1);
                // this.data = rows;
                break;
        }
     }

    handleChangeReqDocsClick(event) {
    this.isModalOpen = true;
    }

    closeModal(event) {
        this.isModalOpen = false;
    }

    submitDetails(event) {
        //alert('todo ' + JSON.stringify(this._selected));

        // move docs between required and non required array
        //['EXL','DOC',...] - only what's required now

        // any doc not in _selected that has a status should be moved to nonreqdocs
        // any _selected that is not in docs should be added to docs, from nonreqdocs if exists, or re-created
        var newDocs = [];
        var newNonReqDocs = [];

        //var docCode;
        var doc;
        //alert('map: ' + JSON.stringify(this.docNameMap));
        //alert('map keys: ' + JSON.stringify(Object.keys(this.docNameMap)));
        Object.keys(this.docNameMap).forEach(docCode => {
            if (this._selected.includes(docCode)) {
                // needs to go in newDocs
                doc = this.docs.find(x => x.Code == docCode);
                if (!doc) doc = this.nonReqDocs.find(x => x.Code == docCode);
                if (!doc) doc = this.createNonSubmittedDoc(docCode);
                newDocs.push(doc);
            } else {
                // needs to go in newNonReqDocs (if it is submitted)
                doc = this.nonReqDocs.find(x => x.Code == docCode);
                //alert('found in non-req: ' + JSON.stringify(doc));
                if (!doc) {doc = this.docs.find(x => x.Code == docCode);  }
                if (doc && !doc.Submitted) doc = null;
                if (doc) newNonReqDocs.push(doc);
            }
        });

        //alert('docs: ' + JSON.stringify(newDocs));
        //alert('non-req docs: ' + JSON.stringify(newNonReqDocs));

        this.docs = newDocs;
        this.nonReqDocs = newNonReqDocs;

        this.saveToDB('Required Documents updated');

        this.isModalOpen = false;
    }

    createNonSubmittedDoc(docCode) {
        return {
            Code: docCode,
            Name: this.docNameMap[docCode],
            Order: this.docOrderMap[docCode],
            Submitted: false,
            ApprovalStatus: '',
            ApprovalStatusIcon: '', 
            isAttached: false,
        };
    }

    _selected = [];
    handleReqDocChange(event) {
        this._selected = event.detail.value;
     }

    get options() {
        return Object.keys(this.docNameMap).map(key => {return { label: this.docNameMap[key], value: key }});
    }

    get values() {
        return this.docs.map(x => x.Code);
    }

    get hasDocs() {
        return this.docs.length > 0;
    }
}
