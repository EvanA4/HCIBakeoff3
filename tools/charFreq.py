def parseLine(line: str):
    vals = line.strip().split(",")
    return {
        'letter': vals[0].lower(),
        'freq': float(vals[1])
    }

fileTxt = open("./tools/charFreqs/freq.txt")
data = sorted(list(map(parseLine, fileTxt.readlines())), key=lambda x : x['freq'], reverse=True)
print(list(map(lambda x : x['letter'], data)))