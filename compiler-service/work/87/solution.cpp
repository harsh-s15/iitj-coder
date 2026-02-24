#include <bits/stdc++.h>
using namespace std;


typedef long long ll;

int main() {
    // Write your code here

    int n;cin>>n;
    ll prev, curr; cin>>prev;
    ll sum = 0;
 
    for(int i=1;i<n;i++){
        cin>>curr;
        if(curr<prev){
            sum += prev - curr;
            curr = prev;
        }
        prev = curr;
 
    }
 
    cout << sum+1;


    return 0;

}