import { LightningElement } from 'lwc';
export default class AcDocs extends LightningElement {
  descriptionsVisible = false;
  
  columns = [
    { label: 'Name', fieldName: 'Name' },
    { label: 'Description', fieldName: 'Description' },
];
  docs = [
        {
            Code: 'X1',
            Name: 'Doc1',
            Description: 'This is an explanation of doc 1',
        },
        {
            Code: 'X2',
            Name: 'Doc2',
            Description: 'This is an explanation of doc 2',
        },
        {
            Code: 'X3',
            Name: 'Doc3',
            Description: '',
        },
        {
            Code: 'X4',
            Name: 'Doc4',
            Description: 'This is an explanation of doc 4',
        },
        {
            Code: 'X5',
            Name: 'Doc5',
            Description: '',
        },
    ];

  required = [
        {
            Code: 'X1',
            Name: 'Doc1',
            Description: 'This is an explanation of doc 1',
        },
        {
            Code: 'X2',
            Name: 'Doc2',
            Description: 'This is an explanation of doc 2',
        },
        {
            Code: 'X3',
            Name: 'Doc3',
            Description: '',
        },
        {
            Code: 'X4',
            Name: 'Doc4',
            Description: 'This is an explanation of doc 4',
        },
        {
            Code: 'X5',
            Name: 'Doc5',
            Description: '',
        },
    ];

  handleChangeShowDescriptions(event) {
        this.descriptionsVisible = event.target.checked;
    }
}