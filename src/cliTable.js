import Table from 'cli-table';

export function createSimpleTable(rows, opts) {
    const table = new Table({
        style: { 'padding-left': 2 },
        colAligns: ['left', 'right', 'right', 'right'],
        chars: {
            'top': '',
            'top-mid': '',
            'top-left': '',
            'top-right': '',
            'bottom': '',
            'bottom-mid': '',
            'bottom-left': '',
            'bottom-right': '',
            'left': '',
            'left-mid': '',
            'mid': '',
            'mid-mid': '',
            'right': '',
            'right-mid': '',
            'middle': ''
        },
        ...opts
    });

    if (rows) {
        table.push(...rows);
    }

    return table;
}
