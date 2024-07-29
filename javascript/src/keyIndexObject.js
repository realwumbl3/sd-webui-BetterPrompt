export function encode(obj) {
    let globalKeys = [];
    let modifiedObject = JSON.parse(JSON.stringify(obj)); // Deep copy the object

    function traverse(obj) {
        if (Array.isArray(obj)) {
            return obj.map((item) => traverse(item));
        } else if (typeof obj === "object" && obj !== null) {
            let newObj = {};
            for (let key in obj) {
                if (obj.hasOwnProperty(key)) {
                    let keyIndex = globalKeys.indexOf(key);
                    if (keyIndex === -1) {
                        globalKeys.push(key);
                        keyIndex = globalKeys.length - 1;
                    }
                    newObj[keyIndex] = traverse(obj[key]);
                }
            }
            return newObj;
        } else {
            return obj;
        }
    }

    modifiedObject = traverse(modifiedObject);
    return [globalKeys, modifiedObject];
}

export function decode(encodedArray) {
    let globalKeys = encodedArray[0];
    let modifiedObject = JSON.parse(JSON.stringify(encodedArray[1])); // Deep copy the object

    function traverse(obj) {
        if (Array.isArray(obj)) {
            return obj.map((item) => traverse(item));
        } else if (typeof obj === "object" && obj !== null) {
            let newObj = {};
            for (let keyIndex in obj) {
                if (obj.hasOwnProperty(keyIndex)) {
                    let key = globalKeys[keyIndex];
                    newObj[key] = traverse(obj[keyIndex]);
                }
            }
            return newObj;
        } else {
            return obj;
        }
    }

    modifiedObject = traverse(modifiedObject);
    return modifiedObject;
}

/* Example usage
let input = {
    key1: "value1",
    key2: "value2",
    options: true,
    manifest: {
        options: false,
    },
    array: [
        {
            key1: "value1",
            key2: "value2",
            options: true,
            manifest: {
                options: false,
            },
        },
        {
            key4: "value1",
            key1: "value2",
            options: false,
            manifest: {
                options: true,
            },
        },
    ],
};

let encoded = encode(input);
console.log("Encoded:", JSON.stringify(encoded));

let decoded = decode(encoded);
console.log("Decoded:", JSON.stringify(decoded));

*/
