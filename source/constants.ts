export const keyletSeparator = "_"; // ASCII: 95
export const compositeSeparator = "|"; // ASCII: 124

export const stringEscapePrefix = "%"; // ASCII: 37
export const keyValuePrefix = "$"; // ASCII: 36
export const keyIndexPrefix = "&"; // ASCII: 38
export const valueIndexPrefix = "'"; // ASCII: 39
export const keyletUseCountPrefix = "#"; // ASCII: 35
export const collectionSizePrefix = "!"; // ASCII: 33

/*
Map.set(["A", "B"], 1);
should result in:
a => "A",
b => "B",
c => 1,
%A => a,
%B => b,
1 => c,
#a => 1,
#b => 1,
#c => 1,
&a => a_b,
&b => a_b,
'c => a_b,
$a_b => c

Map.set(["A", "B"], ["C", "D"]);
should result in:
a => "A",
b => "B",
c => "C",
d => "D",
%A => a,
%B => b,
%C => c,
%D => d,
#a => 1,
#b => 1,
#c => 1,
#d => 1,
&a => a_b,
&b => a_b,
'c => a_b,
'd => a_b,
$a_b => c_d
*/