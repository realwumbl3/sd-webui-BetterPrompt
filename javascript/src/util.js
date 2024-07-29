export function shiftArrayElement(array, element, offset) {
    const index = array.indexOf(element);
    const newIndex = Math.max(0, Math.min(array.length - 1, index + offset));
    array.splice(index, 1);
    array.splice(newIndex, 0, element);
    return array;
}

export async function updateInput(input, value) {
    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
}
