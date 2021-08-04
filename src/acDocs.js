import { LightningElement, wire, api } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import REQ_DOCS_FIELD from '@salesforce/schema/Assistance_Request__c.Required_Documents__c';

export default class AcDocs extends LightningElement {
    @api recordId;

    @wire(getRecord, { recordId: '$recordId', fields: [REQ_DOCS_FIELD] })
    ar;


  descriptionsVisible = false;


  columns = [
    { label: 'Name', fieldName: 'Name' , hideDefaultActions: true},
    {label: 'Status', iconName: 'utility:approval', cellAttributes:
     { iconName: { fieldName: 'ApprovalStatusIcon' }, iconLabel: { fieldName: 'ApprovalStatus'}} , hideDefaultActions: true},
    //{ label: 'Description', fieldName: 'Description'  , hideDefaultActions: true},
    { label: 'Submitted', fieldName: 'Submitted', type: 'boolean', editable: true},
    { label: 'Attached', fieldName: 'isAttached', type: 'boolean' },
    {
        type: 'action',
        typeAttributes: { rowActions: this.getRowActions },
    },
];
  docs = [
        {
            Code: 'X1',
            Name: 'Doc1',
            Description: 'This is an explanation of doc 1',
            Submitted: true,
            ApprovalStatus: 'Rejected',
            ApprovalStatusIcon: 'standard:first_non_empty', 
            isAttached: true,
        },
        {
            Code: 'X2',
            Name: 'Doc2',
            Description: 'This is an explanation of doc 2',
            Submitted: true,
            ApprovalStatus: 'Approved',
            ApprovalStatusIcon: 'standard:approval',
            isAttached: true,
        },
        {
            Code: 'X3',
            Name: 'Doc3',
            Description: '',
            Submitted: false,
            ApprovalStatus: '',
            isAttached: false,
        },
        {
            Code: 'X4',
            Name: 'Doc4',
            Description: 'This is an explanation of doc 4',
            Submitted: true,
            ApprovalStatus: '',
            isAttached: true,
        },
        {
            Code: 'X5',
            Name: 'Doc5',
            Description: '',
            Submitted: true,
            ApprovalStatus: '',
            isAttached: false,
        },
    ];

    getRowActions(row, doneCallback) {
        const actions = [];
        if (row['isAttached']) {
            actions.push({
                'label': 'View',
                'name': 'view'
            });
        }
        if (!row['isAttached']) {
            actions.push({
                'label': 'Attach',
                'name': 'attach'
            });
        }
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


    handleChangeShowDescriptions(event) {
        this.descriptionsVisible = event.target.checked;
    }

    handleCellChange(event) {

    }

    handleRowAction(event) {
        const action = event.detail.action;
        const row = event.detail.row;
        switch (action.name) {
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

}