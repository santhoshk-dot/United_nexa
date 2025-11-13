// A simple utility to convert numbers to Indian currency words
// This is a simplified version. For a full-production app, a more robust library might be needed.

const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function toWords(num: number): string {
  if (num === 0) return 'Zero';
  // Convert to UPPERCASE to match the PDF example
  return convertToWords(num).toUpperCase();
}

function convertToWords(num: number): string {
  let words = '';
  
  if (num >= 10000000) {
    words += convertToWords(Math.floor(num / 10000000)) + ' Crore ';
    num %= 10000000;
  }
  
  if (num >= 100000) {
    words += convertToWords(Math.floor(num / 100000)) + ' Lakh ';
    num %= 100000;
  }
  
  if (num >= 1000) {
    words += convertToWords(Math.floor(num / 1000)) + ' Thousand ';
    num %= 1000;
  }
  
  if (num >= 100) {
    words += convertToWords(Math.floor(num / 100)) + ' Hundred ';
    num %= 100;
  }
  
  if (num > 0) {
    if (num < 20) {
      words += ones[num];
    } else {
      words += tens[Math.floor(num / 10)];
      if (num % 10 > 0) {
        words += ' ' + ones[num % 10];
      }
    }
  }
  
  return words.trim();
}

// Export the base toWords function for use in the "DESCRIPTION" field
export const numberToWords = toWords;

export function numberToWordsInRupees(num: number): string {
  if (typeof num !== 'number') return '';
  const wholePart = Math.floor(num);
  const words = toWords(wholePart);
  // Format as UPPERCASE to match the PDF example
  return `RUPEES ${words} ONLY`;
}