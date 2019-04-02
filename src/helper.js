const resultDefault = (data = {}) => {
    return {
        status: 0,
        ...data
    };
};
module.exports = {
    resultTrue: resultDefault.bind(this, { status: 0 }),
    resultFalse: resultDefault.bind(this, { status: 1 }),
    resultJson: resultDefault
};